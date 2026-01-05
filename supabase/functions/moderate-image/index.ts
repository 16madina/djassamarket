import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fonction pour notifier les admins d'une image rejetée
async function notifyAdmins(supabase: any, imageUrl: string, reason: string | null, uploaderId: string | null) {
  try {
    // Récupérer tous les admins avec leurs push tokens
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError || !adminRoles || adminRoles.length === 0) {
      console.log("No admins found or error fetching admins:", rolesError);
      return;
    }

    const adminIds = adminRoles.map((r: { user_id: string }) => r.user_id);

    // Récupérer les push tokens des admins
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, push_token, full_name")
      .in("id", adminIds)
      .not("push_token", "is", null);

    if (profilesError || !adminProfiles || adminProfiles.length === 0) {
      console.log("No admin push tokens found:", profilesError);
      return;
    }

    // Récupérer le nom de l'uploader si disponible
    let uploaderName = "Utilisateur inconnu";
    if (uploaderId) {
      const { data: uploaderProfile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", uploaderId)
        .single();
      
      if (uploaderProfile) {
        uploaderName = uploaderProfile.full_name || uploaderProfile.first_name || "Utilisateur";
      }
    }

    console.log(`Sending moderation alert to ${adminProfiles.length} admin(s)`);

    // Envoyer une notification push à chaque admin
    for (const admin of adminProfiles) {
      if (!admin.push_token) continue;

      try {
        // Récupérer le service account Firebase
        const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
        if (!firebaseServiceAccount) {
          console.error("FIREBASE_SERVICE_ACCOUNT not configured");
          continue;
        }

        const serviceAccount = JSON.parse(firebaseServiceAccount);

        // Générer le token d'accès OAuth2 pour Firebase
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: "RS256", typ: "JWT" };
        const payload = {
          iss: serviceAccount.client_email,
          scope: "https://www.googleapis.com/auth/firebase.messaging",
          aud: "https://oauth2.googleapis.com/token",
          iat: now,
          exp: now + 3600,
        };

        const encoder = new TextEncoder();
        const base64url = (data: Uint8Array) => {
          return btoa(String.fromCharCode(...data))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
        };

        const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
        const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
        const signatureInput = `${headerB64}.${payloadB64}`;

        // Importer la clé privée
        const pemContent = serviceAccount.private_key
          .replace(/-----BEGIN PRIVATE KEY-----/, "")
          .replace(/-----END PRIVATE KEY-----/, "")
          .replace(/\n/g, "");
        const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

        const cryptoKey = await crypto.subtle.importKey(
          "pkcs8",
          binaryKey,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["sign"]
        );

        const signature = await crypto.subtle.sign(
          "RSASSA-PKCS1-v1_5",
          cryptoKey,
          encoder.encode(signatureInput)
        );

        const jwt = `${signatureInput}.${base64url(new Uint8Array(signature))}`;

        // Échanger le JWT contre un access token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          console.error("Failed to get access token for admin notification");
          continue;
        }

        // Envoyer la notification FCM
        const fcmResponse = await fetch(
          `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: admin.push_token,
                notification: {
                  title: "🚨 Image rejetée par modération",
                  body: `${uploaderName}: ${reason || "Contenu inapproprié détecté"}`,
                },
                data: {
                  type: "moderation_alert",
                  imageUrl: imageUrl,
                  uploaderId: uploaderId || "",
                  reason: reason || "",
                  route: "/admin",
                },
                android: {
                  priority: "high",
                  notification: {
                    color: "#FF0000",
                    channel_id: "moderation_alerts",
                  },
                },
                apns: {
                  payload: {
                    aps: {
                      sound: "default",
                      badge: 1,
                    },
                  },
                },
              },
            }),
          }
        );

        if (fcmResponse.ok) {
          console.log(`Moderation alert sent to admin ${admin.id}`);
        } else {
          const errorText = await fcmResponse.text();
          console.error(`Failed to send moderation alert to admin ${admin.id}:`, errorText);
        }
      } catch (notifyError) {
        console.error(`Error sending notification to admin ${admin.id}:`, notifyError);
      }
    }
  } catch (error) {
    console.error("Error in notifyAdmins:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      // En cas d'erreur de config, on laisse passer l'image (fail-open)
      return new Response(
        JSON.stringify({ safe: true, reason: "Moderation unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing image for moderation:", imageUrl.substring(0, 100) + "...");

    // Récupérer les catégories interdites actives depuis la base de données
    const { data: bannedCategories, error: categoriesError } = await supabase
      .from("banned_image_categories")
      .select("name, description, severity")
      .eq("active", true);

    if (categoriesError) {
      console.error("Error fetching banned categories:", categoriesError);
    }

    // Construire la liste des contenus interdits dynamiquement
    let bannedContentList = "";
    if (bannedCategories && bannedCategories.length > 0) {
      bannedContentList = bannedCategories
        .map((cat: { name: string; description: string | null; severity: string }) => {
          const desc = cat.description ? ` (${cat.description})` : "";
          return `- ${cat.name}${desc} [sévérité: ${cat.severity}]`;
        })
        .join("\n");
    } else {
      // Fallback par défaut si aucune catégorie n'est définie
      bannedContentList = `- Nudité ou contenu sexuel
- Violence graphique
- Armes à feu et armes blanches
- Drogues et substances illicites
- Symboles haineux ou discriminatoires`;
    }

    const systemPrompt = `Tu es un modérateur de contenu pour une marketplace. Analyse l'image et détermine si elle est appropriée pour une annonce de vente.

CONTENUS INTERDITS (répondre "unsafe"):
${bannedContentList}

CONTENUS AUTORISÉS:
- Produits de consommation courante
- Vêtements, accessoires, bijoux
- Électronique, meubles, décoration
- Véhicules, pièces automobiles
- Outils, équipements de bricolage
- Nourriture, produits alimentaires
- Animaux de compagnie (photos appropriées)
- Art, livres, médias
- Tout objet légal à vendre

Réponds UNIQUEMENT avec un JSON valide:
{"safe": true} ou {"safe": false, "reason": "brève explication en français"}`;

    console.log("Using moderation prompt with", bannedCategories?.length || 0, "banned categories");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyse cette image pour modération:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ safe: true, reason: "Rate limit - modération différée" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ safe: true, reason: "Quota exceeded - modération différée" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fail-open pour ne pas bloquer les utilisateurs
      return new Response(
        JSON.stringify({ safe: true, reason: "Moderation service unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI moderation response:", content);

    // Parser la réponse JSON
    try {
      // Nettoyer la réponse (enlever les backticks markdown si présents)
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const result = JSON.parse(cleanContent);
      const isSafe = result.safe === true;
      const reason = result.reason || null;
      
      // Log moderation result to database
      try {
        await supabase.from("image_moderation_logs").insert({
          image_url: imageUrl,
          user_id: userId || null,
          is_safe: isSafe,
          reason: reason,
        });
        console.log("Moderation log saved:", isSafe ? "safe" : "unsafe");
        
        // Si l'image est rejetée, notifier les admins
        if (!isSafe) {
          await notifyAdmins(supabase, imageUrl, reason, userId);
        }
      } catch (logError) {
        console.error("Failed to save moderation log:", logError);
      }
      
      return new Response(
        JSON.stringify({
          safe: isSafe,
          reason: reason
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Content:", content);
      
      // Analyse basique du texte en cas d'échec du parsing
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('"safe": false') || lowerContent.includes('"safe":false')) {
        // Log rejected image
        try {
          await supabase.from("image_moderation_logs").insert({
            image_url: imageUrl,
            user_id: userId || null,
            is_safe: false,
            reason: "Contenu potentiellement inapproprié détecté",
          });
          
          // Notifier les admins
          await notifyAdmins(supabase, imageUrl, "Contenu potentiellement inapproprié détecté", userId);
        } catch (logError) {
          console.error("Failed to save moderation log:", logError);
        }
        
        return new Response(
          JSON.stringify({ safe: false, reason: "Contenu potentiellement inapproprié détecté" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Par défaut, on laisse passer
      return new Response(
        JSON.stringify({ safe: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Moderation error:", error);
    
    // Fail-open: en cas d'erreur, on laisse passer l'image
    return new Response(
      JSON.stringify({ safe: true, reason: "Error during moderation" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

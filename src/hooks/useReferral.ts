import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BoostCard {
  id: string;
  user_id: string;
  status: "available" | "used" | "expired";
  duration_days: number;
  earned_at: string;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: "pending" | "validated";
  validated_at: string | null;
  created_at: string;
}

export interface ListingBoost {
  id: string;
  listing_id: string;
  boost_card_id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  is_active: boolean;
}

export const useReferral = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Get user's referral code
  const { data: referralData, isLoading: isLoadingReferral } = useQuery({
    queryKey: ["referral-code", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, referral_count")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Get user's boost cards
  const { data: boostCards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ["boost-cards", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("boost_cards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BoostCard[];
    },
    enabled: !!userId,
  });

  // Get user's referrals (people they referred)
  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["referrals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Get active boosts for user's listings
  const { data: activeBoosts = [], isLoading: isLoadingBoosts } = useQuery({
    queryKey: ["listing-boosts", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("listing_boosts")
        .select(`
          *,
          listing:listing_id(id, title, images)
        `)
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Apply boost to a listing
  const applyBoostMutation = useMutation({
    mutationFn: async ({ listingId, boostCardId }: { listingId: string; boostCardId: string }) => {
      if (!userId) throw new Error("Non authentifié");

      // Get the boost card details
      const { data: card, error: cardError } = await supabase
        .from("boost_cards")
        .select("*")
        .eq("id", boostCardId)
        .eq("status", "available")
        .single();

      if (cardError || !card) throw new Error("Carte boost non disponible");

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + card.duration_days);

      // Create the listing boost
      const { error: boostError } = await supabase
        .from("listing_boosts")
        .insert({
          listing_id: listingId,
          boost_card_id: boostCardId,
          user_id: userId,
          ends_at: endsAt.toISOString(),
        });

      if (boostError) throw boostError;

      // Mark the card as used
      const { error: updateError } = await supabase
        .from("boost_cards")
        .update({
          status: "used",
          used_at: new Date().toISOString(),
          expires_at: endsAt.toISOString(),
        })
        .eq("id", boostCardId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boost-cards"] });
      queryClient.invalidateQueries({ queryKey: ["listing-boosts"] });
      toast({
        title: "Boost activé !",
        description: "Votre annonce sera en top liste pendant 3 jours",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register referral code during signup
  const registerReferral = async (referralCode: string) => {
    if (!userId) return { success: false, error: "Non authentifié" };

    // Find the referrer by code
    const { data: referrer, error: findError } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (findError || !referrer) {
      return { success: false, error: "Code parrain invalide" };
    }

    if (referrer.id === userId) {
      return { success: false, error: "Vous ne pouvez pas vous parrainer vous-même" };
    }

    // Create the referral record
    const { error: insertError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_id: userId,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { success: false, error: "Vous avez déjà utilisé un code parrain" };
      }
      return { success: false, error: insertError.message };
    }

    // Update the user's profile with referred_by
    await supabase
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", userId);

    return { success: true };
  };

  const availableCards = boostCards.filter((c) => c.status === "available");
  const usedCards = boostCards.filter((c) => c.status === "used");
  const validatedReferrals = referrals.filter((r) => r.status === "validated");
  const pendingReferrals = referrals.filter((r) => r.status === "pending");

  // Progress to next card (3 referrals needed)
  const referralsToNextCard = 3 - (referralData?.referral_count || 0) % 3;
  const progressToNextCard = ((referralData?.referral_count || 0) % 3) / 3 * 100;

  return {
    referralCode: referralData?.referral_code,
    referralCount: referralData?.referral_count || 0,
    boostCards,
    availableCards,
    usedCards,
    referrals,
    validatedReferrals,
    pendingReferrals,
    activeBoosts,
    referralsToNextCard,
    progressToNextCard,
    isLoading: isLoadingReferral || isLoadingCards || isLoadingReferrals || isLoadingBoosts,
    applyBoost: applyBoostMutation.mutate,
    isApplyingBoost: applyBoostMutation.isPending,
    registerReferral,
  };
};

// Hook to check if a listing is boosted
export const useListingBoost = (listingId: string) => {
  const { data: boost, isLoading } = useQuery({
    queryKey: ["listing-boost", listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_boosts")
        .select("*")
        .eq("listing_id", listingId)
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  return {
    isBoosted: !!boost,
    boost,
    isLoading,
  };
};

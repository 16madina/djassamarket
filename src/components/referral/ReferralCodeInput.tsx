import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle2, XCircle } from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { toast } from "@/hooks/use-toast";

interface ReferralCodeInputProps {
  onSuccess?: () => void;
}

export const ReferralCodeInput = ({ onSuccess }: ReferralCodeInputProps) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { registerReferral } = useReferral();

  const handleSubmit = async () => {
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    const result = await registerReferral(code.trim());
    setIsSubmitting(false);

    if (result.success) {
      setStatus("success");
      toast({
        title: "Code parrain accepté !",
        description: "Votre parrain sera récompensé quand vous publierez votre première annonce",
      });
      onSuccess?.();
    } else {
      setStatus("error");
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Code parrain enregistré !
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        <Gift className="h-4 w-4 text-amber-500" />
        Code parrain (optionnel)
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="Ex: AYOKA-ABC123"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setStatus("idle");
          }}
          className={status === "error" ? "border-red-500" : ""}
        />
        <Button
          onClick={handleSubmit}
          disabled={!code.trim() || isSubmitting}
          variant="outline"
          className="shrink-0"
        >
          {isSubmitting ? "..." : "Appliquer"}
        </Button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Code invalide
        </p>
      )}
    </div>
  );
};

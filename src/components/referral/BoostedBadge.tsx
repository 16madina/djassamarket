import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useListingBoost } from "@/hooks/useReferral";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BoostedBadgeProps {
  listingId: string;
  showTimeRemaining?: boolean;
}

export const BoostedBadge = ({ listingId, showTimeRemaining = false }: BoostedBadgeProps) => {
  const { isBoosted, boost } = useListingBoost(listingId);

  if (!isBoosted || !boost) return null;

  const timeRemaining = formatDistanceToNow(new Date(boost.ends_at), { 
    addSuffix: false, 
    locale: fr 
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1 cursor-help">
          <Rocket className="h-3 w-3" />
          Top
          {showTimeRemaining && <span className="text-xs opacity-80">• {timeRemaining}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Annonce boostée - encore {timeRemaining}</p>
      </TooltipContent>
    </Tooltip>
  );
};

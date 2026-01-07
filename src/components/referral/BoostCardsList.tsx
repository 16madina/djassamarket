import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { useReferral, BoostCard } from "@/hooks/useReferral";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface BoostCardsListProps {
  onSelectCard?: (card: BoostCard) => void;
  selectable?: boolean;
}

export const BoostCardsList = ({ onSelectCard, selectable = false }: BoostCardsListProps) => {
  const { boostCards, availableCards, isLoading } = useReferral();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (boostCards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <Rocket className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Pas encore de carte boost
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Parrainez 3 amis pour en obtenir une !
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "used":
        return "bg-blue-500";
      case "expired":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "used":
        return "Utilisée";
      case "expired":
        return "Expirée";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-3">
      {boostCards.map((card) => (
        <Card 
          key={card.id}
          className={`overflow-hidden transition-all ${
            card.status === "available" 
              ? "border-amber-300 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 hover:shadow-lg" 
              : "opacity-60"
          } ${selectable && card.status === "available" ? "cursor-pointer hover:scale-[1.02]" : ""}`}
          onClick={() => {
            if (selectable && card.status === "available" && onSelectCard) {
              onSelectCard(card);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`p-3 rounded-xl ${
                card.status === "available" 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                  : "bg-muted"
              }`}>
                {card.status === "available" ? (
                  <Sparkles className="h-6 w-6 text-white" />
                ) : card.status === "used" ? (
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Clock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">Carte Boost</h4>
                  <Badge className={`${getStatusColor(card.status)} text-white text-xs`}>
                    {getStatusLabel(card.status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {card.duration_days} jours en top liste
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.status === "available" && (
                    <>Obtenue {formatDistanceToNow(new Date(card.earned_at), { addSuffix: true, locale: fr })}</>
                  )}
                  {card.status === "used" && card.expires_at && (
                    <>Expire {formatDistanceToNow(new Date(card.expires_at), { addSuffix: true, locale: fr })}</>
                  )}
                </p>
              </div>

              {/* Action */}
              {selectable && card.status === "available" && (
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  Utiliser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

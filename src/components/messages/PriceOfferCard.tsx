import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceOfferCardProps {
  messageId: string;
  userId: string;
}

export const PriceOfferCard = ({ messageId, userId }: PriceOfferCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offer } = useQuery({
    queryKey: ['price-offer', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateOffer = useMutation({
    mutationFn: async (status: 'accepted' | 'rejected') => {
      if (!offer) return;

      const { error } = await supabase
        .from('price_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-offer', messageId] });
      toast({
        title: 'Offre mise à jour',
        description: 'Le statut de l\'offre a été modifié',
      });
    },
  });

  if (!offer) return null;

  const isReceiver = offer.receiver_id === userId;
  const statusLabels = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Refusée',
    counter: 'Contre-offre',
  };

  return (
    <Card className="bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Offre: {offer.amount.toLocaleString()} FCFA
          </span>
          <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'}>
            {statusLabels[offer.status as keyof typeof statusLabels]}
          </Badge>
        </div>
        
        {isReceiver && offer.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateOffer.mutate('accepted')}
              disabled={updateOffer.isPending}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateOffer.mutate('rejected')}
              disabled={updateOffer.isPending}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Refuser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

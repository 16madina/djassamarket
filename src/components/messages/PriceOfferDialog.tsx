import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceOfferDialogProps {
  conversationId: string;
  listingId: string;
  listingPrice: number;
  senderId: string;
  receiverId: string;
}

export const PriceOfferDialog = ({
  conversationId,
  listingId,
  listingPrice,
  senderId,
  receiverId,
}: PriceOfferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOffer = useMutation({
    mutationFn: async () => {
      const offerAmount = parseFloat(amount);
      
      if (isNaN(offerAmount) || offerAmount <= 0) {
        throw new Error('Montant invalide');
      }

      // Create message first
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          listing_id: listingId,
          conversation_id: conversationId,
          content: `Offre de prix: ${offerAmount.toLocaleString()} FCFA`,
          message_type: 'price_offer',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create price offer
      const { error: offerError } = await supabase
        .from('price_offers')
        .insert({
          conversation_id: conversationId,
          listing_id: listingId,
          sender_id: senderId,
          receiver_id: receiverId,
          amount: offerAmount,
          message_id: messageData.id,
        });

      if (offerError) throw offerError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      setOpen(false);
      setAmount('');
      toast({
        title: 'Offre envoyée',
        description: 'Votre offre de prix a été envoyée',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'offre',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <DollarSign className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Faire une offre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price-offer">
              Prix demandé: {listingPrice.toLocaleString()} FCFA
            </Label>
            <Input
              id="price-offer"
              type="number"
              placeholder="Votre offre..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={() => createOffer.mutate()}
            disabled={createOffer.isPending || !amount}
            className="w-full"
          >
            Envoyer l'offre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

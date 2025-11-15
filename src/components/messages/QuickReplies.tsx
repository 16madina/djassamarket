import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface QuickRepliesProps {
  userId: string;
  onSelect: (message: string) => void;
}

export const QuickReplies = ({ userId, onSelect }: QuickRepliesProps) => {
  const { data: quickReplies } = useQuery({
    queryKey: ['quick-replies', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_replies')
        .select('*')
        .eq('user_id', userId)
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });

  if (!quickReplies || quickReplies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-t bg-muted/20">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>Réponses rapides:</span>
      </div>
      {quickReplies.map((reply) => (
        <Button
          key={reply.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply.message)}
          className="text-xs"
        >
          {reply.message}
        </Button>
      ))}
    </div>
  );
};

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface BlockUserDialogProps {
  userId: string;
  userName: string;
  onBlock?: () => void;
}

export const BlockUserDialog = ({ userId, userName, onBlock }: BlockUserDialogProps) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const { warning, success } = useHaptics();

  const handleBlock = async () => {
    warning();
    setIsBlocking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté pour bloquer un utilisateur");
        return;
      }

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error("Vous avez déjà bloqué cet utilisateur");
        } else {
          throw error;
        }
      } else {
        success();
        toast.success(`${userName} a été bloqué. Vous ne verrez plus ses annonces.`);
        onBlock?.();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error("Erreur lors du blocage de l'utilisateur");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground min-h-[44px]"
          aria-label={`Bloquer ${userName}`}
        >
          <Ban className="h-4 w-4 mr-2" />
          Bloquer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bloquer {userName} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr ? Vous ne verrez plus les annonces de cet utilisateur et ne pourrez plus le contacter.
            Cette action est réversible depuis les paramètres de votre compte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBlock} 
            disabled={isBlocking}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isBlocking ? "Blocage..." : "Bloquer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

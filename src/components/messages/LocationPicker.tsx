import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onSelectLocation: (location: { lat: number; lng: number; name: string }) => void;
}

export const LocationPicker = ({ onSelectLocation }: LocationPickerProps) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'Non supporté',
        description: 'La géolocalisation n\'est pas supportée par votre navigateur',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use a simple geocoding approach or just send coordinates
        const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        onSelectLocation({
          lat: latitude,
          lng: longitude,
          name: locationName,
        });
        
        setOpen(false);
        setLoading(false);
        
        toast({
          title: 'Position partagée',
          description: 'Votre position a été ajoutée au message',
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Impossible d\'obtenir votre position';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vous devez autoriser l\'accès à votre position dans les paramètres de votre navigateur';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Les informations de localisation ne sont pas disponibles';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré. Veuillez réessayer';
            break;
        }
        
        toast({
          title: 'Erreur de géolocalisation',
          description: errorMessage,
          variant: 'destructive',
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <MapPin className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager votre position</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Partagez votre position actuelle pour faciliter la rencontre
          </p>
          <Button
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Obtention de la position...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Utiliser ma position actuelle
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

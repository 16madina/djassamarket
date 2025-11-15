import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onUpload: (url: string) => void;
  userId: string;
}

export const MediaUpload = ({ onUpload, userId }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'La taille maximale est de 5 MB',
          variant: 'destructive',
        });
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('listings')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(data.path);

      onUpload(publicUrl);
      
      toast({
        title: 'Image envoyée',
        description: 'Votre image a été téléchargée avec succès',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        id="media-upload"
        className="hidden"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => document.getElementById('media-upload')?.click()}
        disabled={uploading}
        type="button"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};

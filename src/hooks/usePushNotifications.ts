import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Demander la permission pour les notifications
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          // Enregistrer pour les notifications push
          await PushNotifications.register();
          setIsRegistered(true);
        }

        // Écouter l'enregistrement réussi
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setPushToken(token.value);

          // Sauvegarder le token dans la base de données
          const { error } = await supabase
            .from('profiles')
            .update({ push_token: token.value })
            .eq('id', user.id);

          if (error) {
            console.error('Error saving push token:', error);
          }
        });

        // Écouter les erreurs d'enregistrement
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Écouter les notifications reçues
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('Push notification received: ', notification);
            
            toast({
              title: notification.title || 'Nouvelle notification',
              description: notification.body,
            });
          }
        );

        // Écouter les actions sur les notifications
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push notification action performed', notification);
            
            // Gérer la navigation en fonction de la notification
            const data = notification.notification.data;
            if (data?.route) {
              window.location.href = data.route;
            }
          }
        );
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initializePushNotifications();

    // Cleanup
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  const unregisterNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Supprimer le token de la base de données
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', user.id);
      }

      await PushNotifications.removeAllListeners();
      setIsRegistered(false);
      setPushToken(null);
    } catch (error) {
      console.error('Error unregistering notifications:', error);
    }
  };

  return {
    pushToken,
    isRegistered,
    unregisterNotifications,
  };
};

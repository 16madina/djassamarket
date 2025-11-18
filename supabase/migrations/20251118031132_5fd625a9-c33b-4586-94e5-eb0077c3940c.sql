-- Fonction pour créer une notification système
CREATE OR REPLACE FUNCTION create_system_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_notification_type text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO system_notifications (user_id, title, message, notification_type, metadata)
  VALUES (p_user_id, p_title, p_message, p_notification_type, p_metadata);
END;
$$;

-- Fonction trigger pour notifier les nouveaux messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  listing_title text;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Récupérer le titre de l'annonce
  SELECT title INTO listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Créer une notification pour le destinataire
  INSERT INTO system_notifications (user_id, title, message, notification_type, metadata)
  VALUES (
    NEW.receiver_id,
    '💬 Nouveau message',
    COALESCE(sender_name, 'Un utilisateur') || ' vous a envoyé un message concernant "' || COALESCE(listing_title, 'votre annonce') || '"',
    'message',
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'listing_id', NEW.listing_id,
      'conversation_id', NEW.conversation_id
    )
  );

  RETURN NEW;
END;
$$;

-- Fonction trigger pour notifier les nouveaux avis
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name text;
  listing_title text;
  rating_stars text;
BEGIN
  -- Récupérer le nom du reviewer
  SELECT full_name INTO reviewer_name
  FROM profiles
  WHERE id = NEW.reviewer_id;

  -- Récupérer le titre de l'annonce
  SELECT title INTO listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Créer les étoiles
  rating_stars := repeat('⭐', NEW.rating);

  -- Créer une notification pour le reviewee
  INSERT INTO system_notifications (user_id, title, message, notification_type, metadata)
  VALUES (
    NEW.reviewee_id,
    '⭐ Nouvel avis reçu',
    COALESCE(reviewer_name, 'Un utilisateur') || ' a laissé un avis ' || rating_stars || ' sur "' || COALESCE(listing_title, 'votre annonce') || '"',
    'review',
    jsonb_build_object(
      'review_id', NEW.id,
      'reviewer_id', NEW.reviewer_id,
      'listing_id', NEW.listing_id,
      'rating', NEW.rating
    )
  );

  RETURN NEW;
END;
$$;

-- Fonction trigger pour notifier les nouveaux abonnés
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
BEGIN
  -- Récupérer le nom du follower
  SELECT full_name INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Créer une notification pour le followed
  INSERT INTO system_notifications (user_id, title, message, notification_type, metadata)
  VALUES (
    NEW.followed_id,
    '👤 Nouvel abonné',
    COALESCE(follower_name, 'Un utilisateur') || ' a commencé à vous suivre',
    'follower',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follow_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

DROP TRIGGER IF EXISTS trigger_notify_new_review ON reviews;
CREATE TRIGGER trigger_notify_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();

DROP TRIGGER IF EXISTS trigger_notify_new_follower ON followers;
CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();
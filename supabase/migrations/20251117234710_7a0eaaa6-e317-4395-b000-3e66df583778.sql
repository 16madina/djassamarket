
-- Activer REPLICA IDENTITY FULL pour la table profiles pour obtenir les anciennes valeurs dans les événements UPDATE
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

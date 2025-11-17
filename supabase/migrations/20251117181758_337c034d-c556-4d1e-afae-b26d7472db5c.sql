-- Supprimer le trigger automatique qui vérifie les emails
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.mark_user_verified();

-- Remettre tous les profils en non-vérifié
UPDATE public.profiles 
SET email_verified = false,
    verified_at = NULL;

-- Recréer la fonction handle_new_user pour s'assurer que email_verified est false par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  insert into public.profiles (id, full_name, first_name, last_name, email_verified)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    false
  );
  return new;
end;
$$;
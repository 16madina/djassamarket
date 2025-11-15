-- Add currency field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN currency TEXT DEFAULT 'FCFA' CHECK (currency IN ('FCFA', 'GHS', 'NGN', 'GMD', 'LRD', 'SLL', 'CVE'));

-- Add comment explaining the currency codes
COMMENT ON COLUMN public.profiles.currency IS 'User preferred currency: FCFA (Zone CFA), GHS (Ghana Cedi), NGN (Nigerian Naira), GMD (Gambian Dalasi), LRD (Liberian Dollar), SLL (Sierra Leonean Leone), CVE (Cape Verdean Escudo)';
-- Drop existing check constraint and create a new one with all currencies
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_currency_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_currency_check 
CHECK (currency IN ('FCFA', 'GHS', 'NGN', 'GMD', 'LRD', 'SLL', 'CVE', 'GNF', 'MRU'));
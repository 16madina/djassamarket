-- Add delivery and contact fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_price numeric,
ADD COLUMN IF NOT EXISTS delivery_zone text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS phone_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_available boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.listings.delivery_available IS 'Whether delivery is available for this listing';
COMMENT ON COLUMN public.listings.delivery_price IS 'Delivery price in local currency';
COMMENT ON COLUMN public.listings.delivery_zone IS 'Zone where delivery is available';
COMMENT ON COLUMN public.listings.phone IS 'Contact phone number for this listing';
COMMENT ON COLUMN public.listings.phone_visible IS 'Whether to show phone in listing';
COMMENT ON COLUMN public.listings.whatsapp_available IS 'Whether WhatsApp is available on this phone';
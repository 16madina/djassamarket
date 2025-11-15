-- Create function to increment listing views
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET views = COALESCE(views, 0) + 1
  WHERE id = listing_id;
END;
$$;
-- Add referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Generate unique referral codes for existing users
UPDATE public.profiles 
SET referral_code = 'AYOKA-' || UPPER(SUBSTRING(MD5(id::text || now()::text) FROM 1 FOR 6))
WHERE referral_code IS NULL;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, validated (first listing published)
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- One user can only be referred once
);

-- Create boost cards table
CREATE TABLE public.boost_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available', -- available, used, expired
  duration_days INTEGER NOT NULL DEFAULT 3,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create listing boosts table
CREATE TABLE public.listing_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  boost_card_id UUID NOT NULL REFERENCES public.boost_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, boost_card_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON public.referrals
FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- RLS Policies for boost_cards
CREATE POLICY "Users can view their own boost cards" ON public.boost_cards
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own boost cards" ON public.boost_cards
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for listing_boosts
CREATE POLICY "Users can view their own boosts" ON public.listing_boosts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active boosts" ON public.listing_boosts
FOR SELECT USING (is_active = true AND ends_at > now());

CREATE POLICY "Users can create boosts for their listings" ON public.listing_boosts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own boosts" ON public.listing_boosts
FOR UPDATE USING (auth.uid() = user_id);

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'AYOKA-' || UPPER(SUBSTRING(MD5(NEW.id::text || now()::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for new users
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Function to check and award boost cards (called when referral is validated)
CREATE OR REPLACE FUNCTION public.check_and_award_boost_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_count INTEGER;
  v_card_count INTEGER;
  v_max_cards INTEGER := 5;
  v_referrals_needed INTEGER := 3;
BEGIN
  -- Only process when status changes to 'validated'
  IF NEW.status = 'validated' AND (OLD.status IS NULL OR OLD.status != 'validated') THEN
    -- Update referrer's referral count
    UPDATE public.profiles 
    SET referral_count = referral_count + 1
    WHERE id = NEW.referrer_id
    RETURNING referral_count INTO v_referral_count;
    
    -- Check if user already has max cards
    SELECT COUNT(*) INTO v_card_count
    FROM public.boost_cards
    WHERE user_id = NEW.referrer_id AND status = 'available';
    
    -- Award card every 3 validated referrals, up to max 5 available cards
    IF v_referral_count > 0 AND 
       v_referral_count % v_referrals_needed = 0 AND 
       v_card_count < v_max_cards THEN
      INSERT INTO public.boost_cards (user_id, duration_days)
      VALUES (NEW.referrer_id, 3);
      
      -- Create system notification
      PERFORM public.create_system_notification(
        NEW.referrer_id,
        'Nouvelle carte boost !',
        'Félicitations ! Vous avez obtenu une carte boost de 3 jours grâce à vos parrainages.',
        'referral_reward',
        jsonb_build_object('referral_count', v_referral_count)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for boost card awarding
DROP TRIGGER IF EXISTS award_boost_card_trigger ON public.referrals;
CREATE TRIGGER award_boost_card_trigger
AFTER UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_boost_card();

-- Function to validate referral when user publishes first listing
CREATE OR REPLACE FUNCTION public.validate_referral_on_first_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_count INTEGER;
BEGIN
  -- Check if this is the user's first listing
  SELECT COUNT(*) INTO v_listing_count
  FROM public.listings
  WHERE user_id = NEW.user_id AND id != NEW.id;
  
  -- If first listing, validate any pending referral
  IF v_listing_count = 0 THEN
    UPDATE public.referrals
    SET status = 'validated', validated_at = now()
    WHERE referred_id = NEW.user_id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for first listing validation
DROP TRIGGER IF EXISTS validate_referral_trigger ON public.listings;
CREATE TRIGGER validate_referral_trigger
AFTER INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_referral_on_first_listing();

-- Function to deactivate expired boosts (can be called by cron)
CREATE OR REPLACE FUNCTION public.deactivate_expired_boosts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listing_boosts
  SET is_active = false
  WHERE ends_at < now() AND is_active = true;
END;
$$;
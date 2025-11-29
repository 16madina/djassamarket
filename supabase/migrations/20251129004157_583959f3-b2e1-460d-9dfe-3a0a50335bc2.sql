-- Create banned_words table for content filtering
CREATE TABLE IF NOT EXISTS public.banned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'high', -- high, medium, low
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Admins can manage banned words
CREATE POLICY "Admins can view banned words"
  ON public.banned_words FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert banned words"
  ON public.banned_words FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banned words"
  ON public.banned_words FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial banned words (French common offensive terms and fraud-related words)
INSERT INTO public.banned_words (word, severity) VALUES
  -- Fraud-related
  ('arnaque', 'high'),
  ('arnaquer', 'high'),
  ('escroquerie', 'high'),
  ('fraude', 'high'),
  ('faux', 'medium'),
  ('volé', 'high'),
  ('contrefaçon', 'high'),
  ('spam', 'medium'),
  -- Offensive content indicators
  ('insulte', 'high'),
  ('merde', 'medium'),
  ('putain', 'medium'),
  ('connard', 'high'),
  ('salope', 'high'),
  ('pute', 'high')
ON CONFLICT (word) DO NOTHING;

-- Create index for faster word matching
CREATE INDEX idx_banned_words_word ON public.banned_words(LOWER(word));

-- Function to check if text contains banned words
CREATE OR REPLACE FUNCTION check_banned_words(content TEXT)
RETURNS TABLE(found_word TEXT, severity TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT bw.word, bw.severity
  FROM public.banned_words bw
  WHERE LOWER(content) LIKE '%' || LOWER(bw.word) || '%'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Create table for banned image categories
CREATE TABLE public.banned_image_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.banned_image_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed for edge function)
CREATE POLICY "Anyone can read banned image categories"
ON public.banned_image_categories
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert banned image categories"
ON public.banned_image_categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update banned image categories"
ON public.banned_image_categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete banned image categories"
ON public.banned_image_categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.banned_image_categories (name, description, severity) VALUES
('Nudité', 'Images contenant de la nudité partielle ou complète', 'high'),
('Violence', 'Images montrant de la violence, du sang ou des blessures', 'high'),
('Armes', 'Armes à feu, couteaux ou autres armes dangereuses', 'high'),
('Drogues', 'Drogues illégales ou paraphernalia', 'high'),
('Symboles haineux', 'Symboles de haine, nazis ou discriminatoires', 'high'),
('Contenu sexuel', 'Contenu sexuellement explicite ou suggestif', 'high'),
('Cruauté animale', 'Images de maltraitance ou cruauté envers les animaux', 'high'),
('Contenu choquant', 'Images gore, mutilations ou contenu traumatisant', 'high');

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create site_settings table (key-value CMS store)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (public content)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can modify site settings
CREATE POLICY "Admins can modify site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('logo', '{"url": "", "alt": "Taif Children''s Hospital"}'::jsonb),
  ('hero', '{"badge": "AI-Powered Healthcare Data Assistant", "title_line1": "Chat with Your Data.", "title_line2": "Get Summaries Instantly.", "highlight_word": "Summaries", "description": "Skip manual reports. Our personalized AI assistant performs instant analysis on your hospital KPI data, enabling fast decision-making.", "cta_primary": "Get Started", "cta_secondary": "Learn More"}'::jsonb),
  ('sections_visibility', '{"hero": true, "about": true, "features": true, "domains": true}'::jsonb),
  ('footer', '{"name": "Taif Children''s Hospital", "copyright": "© 2026 Taif Children''s Hospital. Smart Reporting. Powered by Intelligent Chat."}'::jsonb);

-- 7. Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- 8. Storage policies
CREATE POLICY "Anyone can view site assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

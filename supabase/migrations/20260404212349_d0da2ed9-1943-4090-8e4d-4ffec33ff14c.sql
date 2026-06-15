
-- Table for dynamic/custom roles
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read, admins can manage
CREATE POLICY "Anyone can read custom roles" ON public.custom_roles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage custom roles" ON public.custom_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Junction table: assign custom roles to users
CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, custom_role_id)
);

ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user custom roles" ON public.user_custom_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage user custom roles" ON public.user_custom_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default roles
INSERT INTO public.custom_roles (name, color) VALUES
  ('Administrator', '#ef4444'),
  ('Director', '#8b5cf6'),
  ('Doctor', '#3b82f6'),
  ('Nurse', '#10b981'),
  ('Data Collector', '#f59e0b');

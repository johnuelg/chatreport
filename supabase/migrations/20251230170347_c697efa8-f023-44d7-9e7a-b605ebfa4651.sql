-- Create table for role navigation permissions
CREATE TABLE public.role_nav_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_slug text NOT NULL,
  nav_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role_slug, nav_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_nav_permissions TO authenticated;
GRANT ALL ON public.role_nav_permissions TO service_role;

-- Enable RLS
ALTER TABLE public.role_nav_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage nav permissions
CREATE POLICY "Admins can manage nav permissions"
ON public.role_nav_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Authenticated users can view nav permissions
CREATE POLICY "Authenticated users can view nav permissions"
ON public.role_nav_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default permissions for admin (all nav items)
INSERT INTO public.role_nav_permissions (role_slug, nav_key) VALUES
('admin', 'dashboard'),
('admin', 'chat'),
('admin', 'bookmarks'),
('admin', 'documents'),
('admin', 'users'),
('admin', 'settings');

-- Insert default permissions for doctor
INSERT INTO public.role_nav_permissions (role_slug, nav_key) VALUES
('doctor', 'dashboard'),
('doctor', 'chat'),
('doctor', 'bookmarks');

-- Insert default permissions for staff
INSERT INTO public.role_nav_permissions (role_slug, nav_key) VALUES
('staff', 'dashboard'),
('staff', 'chat'),
('staff', 'bookmarks');
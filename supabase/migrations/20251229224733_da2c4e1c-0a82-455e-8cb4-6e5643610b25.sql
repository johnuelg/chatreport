-- Create junction table for user-domain relationships (many-to-many)
CREATE TABLE public.user_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_domains TO authenticated;
GRANT ALL ON public.user_domains TO service_role;

-- Enable RLS
ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage user domains"
ON public.user_domains
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own domains"
ON public.user_domains
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user domains"
ON public.user_domains
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_user_domains_user_id ON public.user_domains(user_id);
CREATE INDEX idx_user_domains_domain_id ON public.user_domains(domain_id);
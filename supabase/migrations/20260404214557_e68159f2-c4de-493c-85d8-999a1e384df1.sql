CREATE TABLE public.user_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain_id)
);

ALTER TABLE public.user_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user domains"
  ON public.user_domains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read user domains"
  ON public.user_domains FOR SELECT TO authenticated
  USING (true);
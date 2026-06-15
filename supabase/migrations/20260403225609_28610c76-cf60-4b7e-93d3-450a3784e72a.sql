
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbreviation text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read domains" ON public.domains FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage domains" ON public.domains FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.domains (name, abbreviation, slug, color, sort_order) VALUES
  ('Emergency Department', 'ED', 'emergency-department', '#3b82f6', 0),
  ('Radiology', 'RAD', 'radiology', '#8b5cf6', 1),
  ('Blood Bank', 'BB', 'blood-bank', '#ef4444', 2),
  ('Laboratory', 'LAB', 'laboratory', '#6b7280', 3),
  ('Neonatal Intensive Care Unit', 'NICU', 'neonatal-intensive-care-unit', '#f59e0b', 4),
  ('Pediatric Intensive Care Unit', 'PICU', 'pediatric-intensive-care-unit', '#10b981', 5),
  ('Cardiopulmonary Resuscitation', 'CPR', 'cardiopulmonary-resuscitation', '#ec4899', 6),
  ('Nursing', 'NUR', 'nursing', '#14b8a6', 7),
  ('Health Quality Index', 'HQI', 'health-quality-index', '#f97316', 8);

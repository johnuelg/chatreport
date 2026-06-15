-- Add domain_id column to quick_questions table
ALTER TABLE public.quick_questions 
ADD COLUMN domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;

-- Create index for efficient domain-based queries
CREATE INDEX idx_quick_questions_domain_id ON public.quick_questions(domain_id);

-- Update RLS policies to allow domain-scoped access
-- Admins can manage all quick questions
CREATE POLICY "Admins can manage quick questions"
ON public.quick_questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view active quick questions
CREATE POLICY "Users can view active quick questions"
ON public.quick_questions
FOR SELECT
TO authenticated
USING (is_active = true);
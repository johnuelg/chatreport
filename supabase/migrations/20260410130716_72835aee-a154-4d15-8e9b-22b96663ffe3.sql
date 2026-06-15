
CREATE TABLE public.user_quick_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_key TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, domain_key)
);

ALTER TABLE public.user_quick_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quick questions"
ON public.user_quick_questions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quick questions"
ON public.user_quick_questions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quick questions"
ON public.user_quick_questions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own quick questions"
ON public.user_quick_questions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user quick questions"
ON public.user_quick_questions FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

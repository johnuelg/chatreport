
-- Allow authenticated users to insert/update site_settings rows with key = 'quick_questions'
CREATE POLICY "Authenticated users can upsert quick_questions"
ON public.site_settings
FOR ALL
TO authenticated
USING (key = 'quick_questions')
WITH CHECK (key = 'quick_questions');

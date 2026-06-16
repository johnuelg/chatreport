DROP POLICY IF EXISTS "Authenticated users can upsert quick_questions" ON public.site_settings;

DROP POLICY IF EXISTS "Users view own ai settings" ON public.user_ai_settings;
DROP POLICY IF EXISTS "Users insert own ai settings" ON public.user_ai_settings;
DROP POLICY IF EXISTS "Users update own ai settings" ON public.user_ai_settings;
DROP POLICY IF EXISTS "Users delete own ai settings" ON public.user_ai_settings;

CREATE POLICY "Users view own ai settings"
ON public.user_ai_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai settings"
ON public.user_ai_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai settings"
ON public.user_ai_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ai settings"
ON public.user_ai_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read user custom roles" ON public.user_custom_roles;
CREATE POLICY "Users read own or admins read all user custom roles"
ON public.user_custom_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can read user domains" ON public.user_domains;
CREATE POLICY "Users read own or admins read all user domains"
ON public.user_domains
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
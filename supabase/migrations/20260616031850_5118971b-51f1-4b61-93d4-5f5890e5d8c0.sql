DROP POLICY IF EXISTS "Admins can view all bookmarks" ON public.chat_bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.chat_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.chat_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.chat_bookmarks;

CREATE POLICY "Admins can view all bookmarks"
ON public.chat_bookmarks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own bookmarks"
ON public.chat_bookmarks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bookmarks"
ON public.chat_bookmarks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks"
ON public.chat_bookmarks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
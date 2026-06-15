
CREATE TABLE public.chat_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_chat_bookmarks_user_message ON public.chat_bookmarks (user_id, message_id);

CREATE POLICY "Users can view own bookmarks" ON public.chat_bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own bookmarks" ON public.chat_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own bookmarks" ON public.chat_bookmarks FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all bookmarks" ON public.chat_bookmarks FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

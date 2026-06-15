
CREATE TABLE public.user_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  gemini_api_key TEXT DEFAULT '',
  use_personal_key BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai settings" ON public.user_ai_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai settings" ON public.user_ai_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ai settings" ON public.user_ai_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ai settings" ON public.user_ai_settings FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_text TEXT DEFAULT '';

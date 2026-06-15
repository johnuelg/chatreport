-- Add domain_id to chat_conversations for organizing chats by domain
ALTER TABLE public.chat_conversations
ADD COLUMN domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;

-- Create index for efficient querying by domain
CREATE INDEX idx_chat_conversations_domain_id ON public.chat_conversations(domain_id);

-- Add index for user_id + domain_id combo queries
CREATE INDEX idx_chat_conversations_user_domain ON public.chat_conversations(user_id, domain_id);
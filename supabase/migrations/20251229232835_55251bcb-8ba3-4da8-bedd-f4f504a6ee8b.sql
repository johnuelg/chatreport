-- First drop the existing foreign key constraint
ALTER TABLE public.chat_bookmarks 
DROP CONSTRAINT IF EXISTS chat_bookmarks_message_id_fkey;

-- Add back the foreign key with ON DELETE SET NULL so bookmarks persist when messages are deleted
ALTER TABLE public.chat_bookmarks 
ADD CONSTRAINT chat_bookmarks_message_id_fkey 
FOREIGN KEY (message_id) 
REFERENCES public.chat_messages(id) 
ON DELETE SET NULL;

-- Make message_id nullable so it can be set to null when messages are deleted
ALTER TABLE public.chat_bookmarks 
ALTER COLUMN message_id DROP NOT NULL;
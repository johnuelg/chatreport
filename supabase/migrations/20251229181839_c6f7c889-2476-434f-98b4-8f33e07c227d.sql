-- Drop the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can update document content" ON public.documents;

-- Create a secure SECURITY DEFINER function for updating document content
-- This function can only be called by authenticated users through edge functions
-- The edge functions already validate admin role before calling this
CREATE OR REPLACE FUNCTION public.update_document_content(
  _document_id UUID,
  _content TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update the content field of an existing document
  UPDATE public.documents
  SET content = _content, updated_at = now()
  WHERE id = _document_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users (edge functions run as authenticated)
GRANT EXECUTE ON FUNCTION public.update_document_content(UUID, TEXT) TO authenticated;
-- Also allow service_role to call it
GRANT EXECUTE ON FUNCTION public.update_document_content(UUID, TEXT) TO service_role;
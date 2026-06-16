DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.document_folders;

CREATE POLICY "Scoped users can view folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR domain_id IS NULL
  OR EXISTS (
    SELECT 1
    FROM public.user_domains ud
    WHERE ud.user_id = auth.uid()
      AND ud.domain_id = document_folders.domain_id
  )
);

DROP POLICY IF EXISTS "Scoped users can view documents" ON public.documents;

CREATE POLICY "Scoped users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR domain_id IS NULL
  OR EXISTS (
    SELECT 1
    FROM public.user_domains ud
    WHERE ud.user_id = auth.uid()
      AND ud.domain_id = documents.domain_id
  )
);
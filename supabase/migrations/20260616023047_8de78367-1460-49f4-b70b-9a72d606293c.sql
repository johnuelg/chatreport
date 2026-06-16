DROP POLICY IF EXISTS "Anyone can view folders" ON public.document_folders;

CREATE POLICY "Authenticated users can view folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can read documents" ON storage.objects;

CREATE POLICY "Admins can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'admin')
);
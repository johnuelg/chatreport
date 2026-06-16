-- 1) site_settings: remove broad authenticated read and split by sensitivity
DROP POLICY IF EXISTS "Authenticated users can read all site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anonymous users can read public site settings" ON public.site_settings;

CREATE POLICY "Admins can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read public site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (
  key IN ('logo', 'hero', 'sections_visibility', 'footer', 'login_page', 'language')
);

CREATE POLICY "Anonymous users can read public site settings"
ON public.site_settings
FOR SELECT
TO anon
USING (
  key IN ('logo', 'hero', 'sections_visibility', 'footer', 'login_page', 'language')
);

-- 2) document_folders: remove null-domain global visibility for non-admin users
DROP POLICY IF EXISTS "Scoped users can view folders" ON public.document_folders;

CREATE POLICY "Scoped users can view folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.user_domains ud
    WHERE ud.user_id = auth.uid()
      AND ud.domain_id = document_folders.domain_id
  )
);

-- 3) documents: remove null-domain global visibility for non-admin users
DROP POLICY IF EXISTS "Scoped users can view documents" ON public.documents;

CREATE POLICY "Scoped users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.user_domains ud
    WHERE ud.user_id = auth.uid()
      AND ud.domain_id = documents.domain_id
  )
);

-- 4) storage.objects documents read policy: remove null-domain global visibility
DROP POLICY IF EXISTS "Domain-scoped users can read documents" ON storage.objects;

CREATE POLICY "Domain-scoped users can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND EXISTS (
          SELECT 1
          FROM public.user_domains ud
          WHERE ud.user_id = auth.uid()
            AND ud.domain_id = d.domain_id
        )
    )
  )
);
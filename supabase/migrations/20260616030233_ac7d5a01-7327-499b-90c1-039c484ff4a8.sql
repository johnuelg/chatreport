-- 1) Storage documents policy: remove broad read and enforce domain-scoped read
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can access own documents" ON storage.objects;

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
        AND (
          d.domain_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.user_domains ud
            WHERE ud.user_id = auth.uid()
              AND ud.domain_id = d.domain_id
          )
        )
    )
  )
);

-- 2) custom_roles: remove anon read, keep authenticated read only
DROP POLICY IF EXISTS "Anyone can read custom roles" ON public.custom_roles;

CREATE POLICY "Authenticated users can read custom roles"
ON public.custom_roles
FOR SELECT
TO authenticated
USING (true);

-- 3) domains: remove anon read, keep authenticated read only
DROP POLICY IF EXISTS "Anyone can read domains" ON public.domains;

CREATE POLICY "Authenticated users can read domains"
ON public.domains
FOR SELECT
TO authenticated
USING (true);

-- 4) site_settings: split full authenticated read from anon public-safe read
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

CREATE POLICY "Authenticated users can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anonymous users can read public site settings"
ON public.site_settings
FOR SELECT
TO anon
USING (
  key IN ('logo', 'hero', 'sections_visibility', 'footer', 'login_page', 'language')
);
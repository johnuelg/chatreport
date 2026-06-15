-- Document revision history for file replacement + rollback (keep last 5)

CREATE TABLE IF NOT EXISTS public.document_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  replaced_by uuid NULL,
  previous_file_path text NOT NULL,
  previous_file_type text NOT NULL,
  previous_file_size integer NOT NULL,
  note text NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS document_revisions_doc_version_uq
  ON public.document_revisions(document_id, version);

CREATE INDEX IF NOT EXISTS document_revisions_doc_created_at_idx
  ON public.document_revisions(document_id, created_at DESC);

ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;

-- Readable to any authenticated user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='document_revisions'
      AND policyname='Authenticated users can view revisions'
  ) THEN
    CREATE POLICY "Authenticated users can view revisions"
    ON public.document_revisions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Admins manage revisions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='document_revisions'
      AND policyname='Admins can manage revisions'
  ) THEN
    CREATE POLICY "Admins can manage revisions"
    ON public.document_revisions
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::text))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::text));
  END IF;
END $$;

-- Next version helper
CREATE OR REPLACE FUNCTION public.next_document_revision_version(_document_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(version), 0) + 1
  FROM public.document_revisions
  WHERE document_id = _document_id;
$$;
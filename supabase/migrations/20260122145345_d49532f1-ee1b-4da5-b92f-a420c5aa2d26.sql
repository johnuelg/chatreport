-- Make folders domain-specific
ALTER TABLE public.document_folders
ADD COLUMN IF NOT EXISTS domain_id uuid NULL;

ALTER TABLE public.document_folders
ADD CONSTRAINT document_folders_domain_id_fkey
FOREIGN KEY (domain_id) REFERENCES public.domains(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_folders_domain_id
ON public.document_folders(domain_id);

-- Optional: keep folder names unique within a domain (but allow same name across domains)
-- We avoid a strict UNIQUE constraint here to prevent failures with existing duplicate folder names.

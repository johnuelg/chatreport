
-- Create document_folders table
CREATE TABLE public.document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add folder_id to documents
ALTER TABLE public.documents ADD COLUMN folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL;

-- RLS for document_folders
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view folders" ON public.document_folders FOR SELECT USING (true);
CREATE POLICY "Admins can insert folders" ON public.document_folders FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update folders" ON public.document_folders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete folders" ON public.document_folders FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

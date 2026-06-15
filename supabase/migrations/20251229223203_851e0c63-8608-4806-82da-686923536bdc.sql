-- Add domain_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_profiles_domain_id ON public.profiles(domain_id);
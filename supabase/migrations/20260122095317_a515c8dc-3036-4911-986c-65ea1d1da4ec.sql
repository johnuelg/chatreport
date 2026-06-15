-- Fix type mismatch causing StorageApiError: "operator does not exist: text = app_role"
-- The user_roles.role column is TEXT, but some policies/functions call has_role(auth.uid(), 'admin'::app_role)
-- which previously compared TEXT to app_role directly.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = (_role::text)
  )
$$;
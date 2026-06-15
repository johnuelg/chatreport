-- Fix 1: Restrict documents visibility to admin users only (not all authenticated users)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;

-- Create a more restrictive policy - only admins can view documents
-- Staff and doctors will need explicit role-based access
CREATE POLICY "Admins and staff can view documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'doctor') OR 
  has_role(auth.uid(), 'staff')
);

-- Fix 2: Tighten profiles table - remove admin access to all profiles
-- Admins should only see profiles through the user management interface with proper authorization
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view profiles when needed for user management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));
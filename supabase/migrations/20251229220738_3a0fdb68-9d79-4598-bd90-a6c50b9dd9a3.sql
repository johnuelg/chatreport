-- Drop and recreate all RLS policies that use has_role with app_role enum casting

-- document_folders policies
DROP POLICY IF EXISTS "Admins can manage folders" ON public.document_folders;
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.document_folders;

CREATE POLICY "Admins can manage folders" ON public.document_folders
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view folders" ON public.document_folders
  FOR SELECT USING (true);

-- document_tag_assignments policies
DROP POLICY IF EXISTS "Admins can manage tag assignments" ON public.document_tag_assignments;
DROP POLICY IF EXISTS "Authenticated users can view tag assignments" ON public.document_tag_assignments;

CREATE POLICY "Admins can manage tag assignments" ON public.document_tag_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view tag assignments" ON public.document_tag_assignments
  FOR SELECT USING (true);

-- document_tags policies
DROP POLICY IF EXISTS "Admins can manage tags" ON public.document_tags;
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.document_tags;

CREATE POLICY "Admins can manage tags" ON public.document_tags
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view tags" ON public.document_tags
  FOR SELECT USING (true);

-- documents policies
DROP POLICY IF EXISTS "Admins and staff can view documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.documents;

CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert documents" ON public.documents
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents" ON public.documents
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- quick_questions policies
DROP POLICY IF EXISTS "Admins can manage questions" ON public.quick_questions;
DROP POLICY IF EXISTS "Authenticated users can view active questions" ON public.quick_questions;

CREATE POLICY "Admins can manage questions" ON public.quick_questions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active questions" ON public.quick_questions
  FOR SELECT USING (is_active = true);

-- roles table policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT USING (true);

-- user_roles policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
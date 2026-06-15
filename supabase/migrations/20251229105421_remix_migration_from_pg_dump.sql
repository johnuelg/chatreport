CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'doctor',
    'staff'
);


--
-- Name: document_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_category AS ENUM (
    'ED',
    'BB',
    'LAB',
    'RAD',
    'CLINICAL_AUDIT',
    'HQI'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.email
  );
  
  -- Default role is staff
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE public.chat_conversations 
    SET updated_at = now() 
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: chat_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message_id uuid NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New Chat'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    conversation_id uuid,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: document_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#6366f1'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: document_tag_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_tag_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    uploaded_by uuid,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    content text,
    folder_id uuid,
    category public.document_category
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quick_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quick_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'staff'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_bookmarks chat_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_bookmarks
    ADD CONSTRAINT chat_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: chat_bookmarks chat_bookmarks_user_id_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_bookmarks
    ADD CONSTRAINT chat_bookmarks_user_id_message_id_key UNIQUE (user_id, message_id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: document_folders document_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_folders
    ADD CONSTRAINT document_folders_pkey PRIMARY KEY (id);


--
-- Name: document_tag_assignments document_tag_assignments_document_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_assignments
    ADD CONSTRAINT document_tag_assignments_document_id_tag_id_key UNIQUE (document_id, tag_id);


--
-- Name: document_tag_assignments document_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_assignments
    ADD CONSTRAINT document_tag_assignments_pkey PRIMARY KEY (id);


--
-- Name: document_tags document_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_name_key UNIQUE (name);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quick_questions quick_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quick_questions
    ADD CONSTRAINT quick_questions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_chat_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);


--
-- Name: idx_chat_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);


--
-- Name: idx_documents_content_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_content_search ON public.documents USING gin (to_tsvector('english'::regconfig, COALESCE(content, ''::text)));


--
-- Name: chat_messages update_conversation_on_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: document_folders update_document_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_folders_updated_at BEFORE UPDATE ON public.document_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quick_questions update_quick_questions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quick_questions_updated_at BEFORE UPDATE ON public.quick_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_bookmarks chat_bookmarks_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_bookmarks
    ADD CONSTRAINT chat_bookmarks_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: document_folders document_folders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_folders
    ADD CONSTRAINT document_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: document_tag_assignments document_tag_assignments_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_assignments
    ADD CONSTRAINT document_tag_assignments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_tag_assignments document_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_assignments
    ADD CONSTRAINT document_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.document_tags(id) ON DELETE CASCADE;


--
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.document_folders(id) ON DELETE SET NULL;


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: documents Admins can delete documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Admins can insert documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: document_folders Admins can manage folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage folders" ON public.document_folders USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quick_questions Admins can manage questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage questions" ON public.quick_questions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: document_tag_assignments Admins can manage tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tag assignments" ON public.document_tag_assignments USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: document_tags Admins can manage tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage tags" ON public.document_tags USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documents Admins can update documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update documents" ON public.documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quick_questions Authenticated users can view active questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active questions" ON public.quick_questions FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: documents Authenticated users can view documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);


--
-- Name: document_folders Authenticated users can view folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view folders" ON public.document_folders FOR SELECT USING (true);


--
-- Name: document_tag_assignments Authenticated users can view tag assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view tag assignments" ON public.document_tag_assignments FOR SELECT USING (true);


--
-- Name: document_tags Authenticated users can view tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view tags" ON public.document_tags FOR SELECT USING (true);


--
-- Name: documents Service role can update document content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can update document content" ON public.documents FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: chat_bookmarks Users can create own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own bookmarks" ON public.chat_bookmarks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can create own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own conversations" ON public.chat_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_bookmarks Users can delete own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own bookmarks" ON public.chat_bookmarks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can delete own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can delete own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can insert own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_bookmarks Users can update own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookmarks" ON public.chat_bookmarks FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can update own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own conversations" ON public.chat_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: chat_bookmarks Users can view own bookmarks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bookmarks" ON public.chat_bookmarks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_conversations Users can view own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversations" ON public.chat_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile and admins can view all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile and admins can view all" ON public.profiles FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));

--
-- Name: public table grants; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_tag_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.document_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quick_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

GRANT ALL ON TABLE public.chat_bookmarks TO service_role;
GRANT ALL ON TABLE public.chat_conversations TO service_role;
GRANT ALL ON TABLE public.chat_messages TO service_role;
GRANT ALL ON TABLE public.document_folders TO service_role;
GRANT ALL ON TABLE public.document_tag_assignments TO service_role;
GRANT ALL ON TABLE public.document_tags TO service_role;
GRANT ALL ON TABLE public.documents TO service_role;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.quick_questions TO service_role;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: chat_bookmarks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: document_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: document_tag_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_tag_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: document_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quick_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quick_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;
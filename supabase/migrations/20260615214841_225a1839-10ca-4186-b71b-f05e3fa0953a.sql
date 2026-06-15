REVOKE SELECT ON TABLE
  public.chat_bookmarks,
  public.chat_conversations,
  public.chat_messages,
  public.custom_roles,
  public.document_folders,
  public.documents,
  public.domains,
  public.profiles,
  public.site_settings,
  public.user_ai_settings,
  public.user_custom_roles,
  public.user_domains,
  public.user_quick_questions,
  public.user_roles
FROM anon;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
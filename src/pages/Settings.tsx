import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { QuickQuestionsSettings } from "@/components/settings/QuickQuestionsSettings";
import { ChatResetSettings } from "@/components/settings/ChatResetSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ChangePasswordSettings } from "@/components/settings/ChangePasswordSettings";
import { RolesSettings } from "@/components/settings/RolesSettings";
import { DomainsSettings } from "@/components/settings/DomainsSettings";
import { NavPermissionsSettings } from "@/components/settings/NavPermissionsSettings";
import { DatabaseConnectionSettings } from "@/components/settings/DatabaseConnectionSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        if ((error as { code?: string }).code === "PGRST205") {
          const fallbackRole = (user.user_metadata?.role as string | undefined) ?? "staff";
          setIsAdmin(fallbackRole === "admin");
        } else {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">{t("settings.title")}</h1>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="account">Account</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="nav-permissions">Nav Permissions</TabsTrigger>
                <TabsTrigger value="domains">Domains</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="language">{t("settings.language")}</TabsTrigger>
                <TabsTrigger value="chat">{t("settings.quickQuestions")}</TabsTrigger>
                <TabsTrigger value="data">{t("settings.dataManagement")}</TabsTrigger>
              </>
            )}
          </TabsList>
          <TabsContent value="account" className="mt-6">
            <ChangePasswordSettings />
          </TabsContent>
          {isAdmin && (
            <>
              <TabsContent value="roles" className="mt-6">
                <RolesSettings />
              </TabsContent>
              <TabsContent value="nav-permissions" className="mt-6">
                <NavPermissionsSettings />
              </TabsContent>
              <TabsContent value="domains" className="mt-6">
                <DomainsSettings />
              </TabsContent>
              <TabsContent value="database" className="mt-6">
                <DatabaseConnectionSettings />
              </TabsContent>
              <TabsContent value="language" className="mt-6">
                <LanguageSettings />
              </TabsContent>
              <TabsContent value="chat" className="mt-6">
                <QuickQuestionsSettings />
              </TabsContent>
              <TabsContent value="data" className="mt-6">
                <ChatResetSettings />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

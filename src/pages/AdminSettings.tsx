import { useEffect, useState } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { SiteSettings, useSaveSiteSettings, useSiteSettings, useIsAdmin } from "@/hooks/useSiteSettings";
import AdminLayout from "@/components/admin/AdminLayout";
import SettingsAccount from "@/components/admin/settings/SettingsAccount";
import SettingsLogoManagement from "@/components/admin/settings/SettingsLogoManagement";
import SettingsRoles from "@/components/admin/settings/SettingsRoles";
import SettingsDomains from "@/components/admin/settings/SettingsDomains";
import SettingsLoginPage from "@/components/admin/settings/SettingsLoginPage";
import SettingsLanguage from "@/components/admin/settings/SettingsLanguage";
import SettingsPlaceholder from "@/components/admin/settings/SettingsPlaceholder";
import SettingsNavPermissions from "@/components/admin/settings/SettingsNavPermissions";
import SettingsQuickQuestions from "@/components/admin/settings/SettingsQuickQuestions";
import SettingsAiProvider from "@/components/admin/settings/SettingsAiProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const allTabs = [
  { key: "account", label: "Account", adminOnly: false },
  { key: "logo-management", label: "Logo Management", adminOnly: true },
  { key: "roles", label: "Roles", adminOnly: true },
  { key: "nav-permissions", label: "Nav Permissions", adminOnly: true },
  { key: "domains", label: "Domains", adminOnly: true },
  { key: "login-page", label: "Login Page", adminOnly: true },
  { key: "language", label: "Language", adminOnly: true },
  { key: "quick-questions", label: "Quick Questions", adminOnly: false },
  { key: "ai-provider", label: "AI Provider", adminOnly: false },
  { key: "data-management", label: "Data Management", adminOnly: false },
] as const;

type TabKey = (typeof allTabs)[number]["key"];

const AdminSettings = () => {
  const { data: isAdmin } = useIsAdmin();
  const tabs = allTabs.filter((tab) => isAdmin || !tab.adminOnly);
  const [activeTab, setActiveTab] = useState<TabKey>("account");
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const saveSettings = useSaveSiteSettings();
  const [draftSettings, setDraftSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setDraftSettings(settings);
    }
  }, [settings]);

  const saveAllChanges = async () => {
    if (!draftSettings) return;

    try {
      await saveSettings.mutateAsync(draftSettings);
      toast({ title: "Settings saved", description: "All tab changes were saved successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  if (settingsLoading || !draftSettings) {
    return (
      <AdminLayout allowNonAdmin>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "account": return <SettingsAccount />;
      case "logo-management": return (
        <SettingsLogoManagement
          logo={draftSettings.logo}
          onLogoChange={(logo) => setDraftSettings((prev) => prev ? { ...prev, logo } : prev)}
          onSaveAll={saveAllChanges}
          saving={saveSettings.isPending}
        />
      );
      case "roles": return <SettingsRoles />;
      case "domains": return <SettingsDomains />;
      case "login-page": return (
        <SettingsLoginPage
          loginPage={draftSettings.login_page}
          onChange={(login_page) => setDraftSettings((prev) => prev ? { ...prev, login_page } : prev)}
          onSaveAll={saveAllChanges}
          saving={saveSettings.isPending}
        />
      );
      case "nav-permissions": return <SettingsNavPermissions />;
      case "language": return (
        <SettingsLanguage
          langSettings={draftSettings.language as any}
          onChange={(language) => setDraftSettings((prev) => prev ? { ...prev, language } : prev)}
          onSaveAll={saveAllChanges}
          saving={saveSettings.isPending}
        />
      );
      case "quick-questions": return <SettingsQuickQuestions />;
      case "ai-provider": return <SettingsAiProvider />;
      case "data-management": return <SettingsPlaceholder title="Data Management" description="Manage data import, export, and cleanup operations." />;
    }
  };

  return (
    <AdminLayout allowNonAdmin>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Settings</h1>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={saveAllChanges} disabled={saveSettings.isPending} className="gap-2">
              {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </Button>
          </div>
        )}

        {/* Tabs - scrollable on mobile */}
        <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl p-1 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTab()}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;

import { useState, useEffect } from "react";
import { useDomains } from "@/hooks/useDomains";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { useUserQuickQuestions, useSaveUserQuickQuestions } from "@/hooks/useUserQuickQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2, MessageSquare, Globe, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getIconComponent } from "./DomainIconPicker";

interface QuickQuestionsData {
  [domainId: string]: string[];
}

/** Admin-level global quick questions from site_settings */
function useQuickQuestions() {
  return useQuery({
    queryKey: ["site-settings", "quick_questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "quick_questions")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as QuickQuestionsData) ?? {};
    },
  });
}

function useSaveQuickQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: QuickQuestionsData) => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        key: "quick_questions",
        value: JSON.parse(JSON.stringify(value)),
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      };
      const { data: updated, error: updateError } = await supabase
        .from("site_settings")
        .update({ value: payload.value, updated_at: payload.updated_at, updated_by: payload.updated_by })
        .eq("key", "quick_questions")
        .select("key");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase.from("site_settings").insert(payload);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings", "quick_questions"] });
      toast({ title: "Quick questions saved" });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}

export { useQuickQuestions };
export type { QuickQuestionsData };

// ─── Shared question list editor ───────────────────────────────────────────

interface QuestionListEditorProps {
  questions: string[];
  onAdd: () => void;
  onChange: (idx: number, val: string) => void;
  onRemove: (idx: number) => void;
  label: string;
}

const QuestionListEditor = ({ questions, onAdd, onChange, onRemove, label }: QuestionListEditorProps) => (
  <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onAdd} className="gap-1.5 text-xs">
        <Plus className="w-3.5 h-3.5" /> Add
      </Button>
    </div>
    {questions.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">
        No quick questions yet. Click "Add" to create one.
      </p>
    ) : (
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={`Question ${i + 1}...`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(i)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────

const SettingsQuickQuestions = () => {
  const { data: domains, isLoading: domainsLoading } = useDomains();
  const { data: isAdmin } = useIsAdmin();

  // Admin global questions
  const { data: savedQuestions, isLoading: questionsLoading } = useQuickQuestions();
  const saveQuestions = useSaveQuickQuestions();
  const [adminDraft, setAdminDraft] = useState<QuickQuestionsData>({});

  // Per-user questions
  const { data: savedUserQuestions, isLoading: userQuestionsLoading } = useUserQuickQuestions();
  const saveUserQuestions = useSaveUserQuickQuestions();
  const [userDraft, setUserDraft] = useState<QuickQuestionsData>({});

  const [activeDomain, setActiveDomain] = useState<string>("__global__");

  useEffect(() => {
    if (savedQuestions) setAdminDraft(savedQuestions);
  }, [savedQuestions]);

  useEffect(() => {
    if (savedUserQuestions) setUserDraft(savedUserQuestions);
  }, [savedUserQuestions]);

  if (domainsLoading || questionsLoading || userQuestionsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Admin questions for current domain
  const adminQuestions = adminDraft[activeDomain] ?? [];
  // User questions for current domain
  const userQuestions = userDraft[activeDomain] ?? [];

  const domainLabel = activeDomain === "__global__"
    ? "All Domains"
    : domains?.find((d) => d.id === activeDomain)?.name ?? activeDomain;

  // ── Admin draft helpers ──
  const updateAdminQ = (qs: string[]) => setAdminDraft((p) => ({ ...p, [activeDomain]: qs }));
  const addAdminQ = () => updateAdminQ([...adminQuestions, ""]);
  const changeAdminQ = (i: number, v: string) => { const c = [...adminQuestions]; c[i] = v; updateAdminQ(c); };
  const removeAdminQ = (i: number) => updateAdminQ(adminQuestions.filter((_, idx) => idx !== i));

  // ── User draft helpers ──
  const updateUserQ = (qs: string[]) => setUserDraft((p) => ({ ...p, [activeDomain]: qs }));
  const addUserQ = () => updateUserQ([...userQuestions, ""]);
  const changeUserQ = (i: number, v: string) => { const c = [...userQuestions]; c[i] = v; updateUserQ(c); };
  const removeUserQ = (i: number) => updateUserQ(userQuestions.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (isAdmin) {
      await saveQuestions.mutateAsync(adminDraft);
    }
    await saveUserQuestions.mutateAsync(userDraft);
  };

  const saving = saveQuestions.isPending || saveUserQuestions.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">Quick Questions</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Configure global quick questions and your personal ones per domain."
              : "Customize your personal quick question prompts per domain."}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>

      {/* Domain tabs */}
      <div className="flex items-center gap-1 bg-card border border-border/50 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveDomain("__global__")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeDomain === "__global__"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Globe className="w-4 h-4" />
          All Domains
        </button>
        {domains?.map((d) => {
          const Icon = getIconComponent(d.icon);
          return (
            <button
              key={d.id}
              onClick={() => setActiveDomain(d.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeDomain === d.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {d.abbreviation}
            </button>
          );
        })}
      </div>

      {/* Admin global questions (admin only) */}
      {isAdmin && (
        <QuestionListEditor
          questions={adminQuestions}
          onAdd={addAdminQ}
          onChange={changeAdminQ}
          onRemove={removeAdminQ}
          label={`${domainLabel} — Global Questions (visible to all users)`}
        />
      )}

      {/* Read-only view of admin questions for non-admins */}
      {!isAdmin && adminQuestions.length > 0 && (
        <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              {domainLabel} — Default Questions (set by admin)
            </span>
          </div>
          <div className="space-y-1.5">
            {adminQuestions.filter((q) => q.trim()).map((q, i) => (
              <div key={i} className="text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                {q}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-user personal questions */}
      <QuestionListEditor
        questions={userQuestions}
        onAdd={addUserQ}
        onChange={changeUserQ}
        onRemove={removeUserQ}
        label={`${domainLabel} — My Questions (personal)`}
      />
    </div>
  );
};

export default SettingsQuickQuestions;

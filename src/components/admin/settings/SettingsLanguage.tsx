import { useState, useRef } from "react";
import type { SiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Globe, Save, Loader2, ChevronDown, ChevronRight, X, GripVertical, Plus } from "lucide-react";
import { mergeLanguageSettings, type SiteLanguageSettings } from "@/lib/site-language";

type LanguageSettings = SiteSettings["language"];
type SectionKey = Exclude<keyof SiteLanguageSettings["translations"], "domain_cards">;

const sectionLabels: Record<SectionKey, { en: string; icon: string }> = {
  hero: { en: "Hero Section", icon: "🏠" },
  about: { en: "About Section", icon: "ℹ️" },
  ai_features: { en: "AI Features", icon: "🤖" },
  domains: { en: "Hospital Domains", icon: "🏥" },
  footer: { en: "Footer", icon: "🔻" },
  login: { en: "Login Page", icon: "🔐" },
};

const TypewriterWordsEditor = ({
  words,
  onChange,
  langLabel,
  langCode,
  dir = "ltr",
}: {
  words: string[];
  onChange: (words: string[]) => void;
  langLabel: string;
  langCode: string;
  dir?: string;
}) => {
  const [newWord, setNewWord] = useState("");
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const addWord = () => {
    const trimmed = newWord.trim();
    if (trimmed && !words.includes(trimmed)) {
      onChange([...words, trimmed]);
      setNewWord("");
    }
  };

  const removeWord = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const reordered = [...words];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    onChange(reordered);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span className={`text-[10px] ${langCode === "en" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"} px-1.5 py-0.5 rounded font-bold`}>
          {langCode.toUpperCase()}
        </span>
        {langLabel}
      </Label>
      <div className="flex flex-wrap gap-2" dir={dir}>
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/70 border border-border/50 text-sm font-medium text-foreground cursor-grab active:cursor-grabbing hover:bg-secondary transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span>{word}</span>
            <button
              onClick={() => removeWord(index)}
              className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWord())}
          placeholder="Add a word..."
          className="text-sm flex-1"
          dir={dir}
        />
        <Button variant="outline" size="sm" onClick={addWord} className="gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
};

const TranslationField = ({
  label,
  enValue,
  arValue,
  onEnChange,
  onArChange,
  multiline = false,
}: {
  label: string;
  enValue: string;
  arValue: string;
  onEnChange: (v: string) => void;
  onArChange: (v: string) => void;
  multiline?: boolean;
}) => {
  const InputComp = multiline ? Textarea : Input;
  return (
    <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/30">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">EN</span>
            English
          </Label>
          <InputComp
            value={enValue}
            onChange={(e) => onEnChange(e.target.value)}
            className="text-sm"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-bold">AR</span>
            العربية (Arabic)
          </Label>
          <InputComp
            value={arValue}
            onChange={(e) => onArChange(e.target.value)}
            className="text-sm text-right"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
};

interface SettingsLanguageProps {
  langSettings: LanguageSettings;
  onChange: (value: LanguageSettings) => void;
  onSaveAll: () => Promise<void>;
  saving?: boolean;
}

const SettingsLanguage = ({ langSettings, onChange, onSaveAll, saving = false }: SettingsLanguageProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ hero: true });
  const resolvedSettings = mergeLanguageSettings(langSettings);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateTranslation = (
    section: SectionKey,
    field: string,
    lang: "en" | "ar",
    value: string
  ) => {
    const nextSettings = mergeLanguageSettings(langSettings);

    onChange({
      ...nextSettings,
      translations: {
        ...nextSettings.translations,
        [section]: {
          ...nextSettings.translations[section],
          [field]: {
            ...(nextSettings.translations[section] as any)[field],
            [lang]: value,
          },
        },
      },
    });
  };

  const updateDomainCard = (key: string, lang: "en" | "ar", value: string) => {
    const nextSettings = mergeLanguageSettings(langSettings);
    onChange({
      ...nextSettings,
      translations: {
        ...nextSettings.translations,
        domain_cards: {
          ...nextSettings.translations.domain_cards,
          [key]: {
            ...nextSettings.translations.domain_cards[key],
            [lang]: value,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Languages className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">Language Settings</h2>
            <p className="text-sm text-muted-foreground">Manage default language and translations</p>
          </div>
        </div>
      </div>

      {/* Default Language */}
      <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Default Site Language</h3>
        </div>
        <Select
          value={resolvedSettings.default_language}
          onValueChange={(val) => onChange({ ...resolvedSettings, default_language: val as "en" | "ar" })}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">
              <span className="flex items-center gap-2">🇺🇸 English</span>
            </SelectItem>
            <SelectItem value="ar">
              <span className="flex items-center gap-2">🇸🇦 العربية (Saudi Arabic)</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This sets the primary display language. Arabic enables right-to-left (RTL) layout automatically.
        </p>
      </div>

      {/* Translation Sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Content Translations</h3>

        {(Object.keys(sectionLabels) as SectionKey[]).map((sectionKey) => {
          const section = resolvedSettings.translations[sectionKey];
          const isExpanded = expandedSections[sectionKey];
          const fields = Object.keys(section);
          const meta = sectionLabels[sectionKey];

          return (
            <div key={sectionKey} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{meta.icon}</span>
                  {meta.en}
                  <span className="text-xs text-muted-foreground font-normal">({fields.length} fields)</span>
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                  {fields.map((field) => {
                    const val = (section as any)[field];

                    // Special UI for typewriter_words
                    if (field === "typewriter_words") {
                      const enWords = val.en ? val.en.split(",").map((w: string) => w.trim()).filter(Boolean) : [];
                      const arWords = val.ar ? val.ar.split(",").map((w: string) => w.trim()).filter(Boolean) : [];
                      return (
                        <div key={field} className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border/30">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Typewriter Words</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder. Words cycle in the hero headline typewriter effect.</p>
                          </div>
                          <TypewriterWordsEditor
                            words={enWords}
                            onChange={(w) => updateTranslation(sectionKey, field, "en", w.join(", "))}
                            langLabel="English"
                            langCode="en"
                          />
                          <TypewriterWordsEditor
                            words={arWords}
                            onChange={(w) => updateTranslation(sectionKey, field, "ar", w.join(", "))}
                            langLabel="العربية (Arabic)"
                            langCode="ar"
                            dir="rtl"
                          />
                        </div>
                      );
                    }

                    const isLong = val.en.length > 80 || val.ar.length > 80;
                    return (
                      <TranslationField
                        key={field}
                        label={field.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        enValue={val.en}
                        arValue={val.ar}
                        onEnChange={(v) => updateTranslation(sectionKey, field, "en", v)}
                        onArChange={(v) => updateTranslation(sectionKey, field, "ar", v)}
                        multiline={isLong}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Domain Cards */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <button
            onClick={() => toggleSection("domain_cards")}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>🏷️</span>
              Domain Card Names
              <span className="text-xs text-muted-foreground font-normal">
                ({Object.keys(resolvedSettings.translations.domain_cards).length} cards)
              </span>
            </span>
            {expandedSections["domain_cards"] ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedSections["domain_cards"] && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              {Object.entries(resolvedSettings.translations.domain_cards).map(([key, val]) => (
                <TranslationField
                  key={key}
                  label={`${key} — Domain Name`}
                  enValue={val.en}
                  arValue={val.ar}
                  onEnChange={(v) => updateDomainCard(key, "en", v)}
                  onArChange={(v) => updateDomainCard(key, "ar", v)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsLanguage;

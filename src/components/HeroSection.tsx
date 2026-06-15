import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import FloatingDomainIcons from "@/components/FloatingDomainIcons";

const DEFAULT_TYPEWRITER_WORDS = ["Answers", "Summaries", "Charts", "Reports", "Insights"];
const TYPING_SPEED = 100;
const DELETING_SPEED = 50;
const PAUSE_AFTER_TYPING = 1500;
const PAUSE_BEFORE_TYPING = 500;

const useTypewriter = (words: string[]) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    if (!isDeleting && text === currentWord) {
      const id = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPING);
      return () => clearTimeout(id);
    }
    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      const id = setTimeout(() => {}, PAUSE_BEFORE_TYPING);
      return () => clearTimeout(id);
    }
    const delay = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const id = setTimeout(() => {
      setText(isDeleting ? currentWord.slice(0, text.length - 1) : currentWord.slice(0, text.length + 1));
    }, delay);
    return () => clearTimeout(id);
  }, [text, isDeleting, wordIndex, words]);

  return text;
};

const HIGHLIGHT_PHRASES: Record<string, string[]> = {
  en: [
    "Skip manual reports.",
    "instant analysis",
    "fast decision-making.",
    "answers, solutions,",
    "insights",
    "No spreadsheets. No delays.",
  ],
  ar: [
    "تخطَّ التقارير اليدوية.",
    "بتحليل فوري",
    "اتخاذ قرارات سريعة.",
    "الإجابات والحلول",
    "الرؤى",
    "بدون جداول بيانات. بدون تأخير.",
  ],
};

const renderHighlighted = (text: string, lang: string) => {
  const phrases = HIGHLIGHT_PHRASES[lang] || HIGHLIGHT_PHRASES.en;
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(${phrases.map(escape).join("|")})`, "g");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    phrases.includes(part) ? (
      <strong key={i} className="font-bold text-primary">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const HeroSection = () => {
  const { data: settings } = useSiteSettings();
  const { lang, t } = useLanguage();
  const hero = settings?.hero;

  const fallbacks: Record<string, { en: string; ar: string }> = {
    badge: { en: "AI-Powered Healthcare Data Assistant", ar: "مساعد بيانات الرعاية الصحية المدعوم بالذكاء الاصطناعي" },
    title_line1: { en: "Chat with Your Data.", ar: "تحدث مع بياناتك." },
    title_line2: { en: "Get {word} Instantly.", ar: "احصل على {word} فوراً." },
    description: {
      en: "Skip manual reports. Our personalized AI assistant performs instant analysis on your hospital KPI data, enabling fast decision-making. By evaluating operational performance, it delivers the answers, solutions, and insights needed to optimize how your hospital operates. — No spreadsheets. No delays.",
      ar: "تخطَّ التقارير اليدوية. يقوم مساعد الذكاء الاصطناعي المخصص بتحليل فوري لبيانات مؤشرات الأداء الرئيسية في مستشفاك، مما يتيح اتخاذ قرارات سريعة. من خلال تقييم الأداء التشغيلي، يقدم الإجابات والحلول والرؤى اللازمة لتحسين عمل مستشفاك. — بدون جداول بيانات. بدون تأخير."
    },
    cta_primary: { en: "Get Started", ar: "ابدأ الآن" },
    cta_secondary: { en: "Learn More", ar: "اعرف المزيد" },
  };
  const fb = (field: string) => t("hero", field) || (hero as any)?.[field] || fallbacks[field]?.[lang] || fallbacks[field]?.en || "";

  const titleLine1 = fb("title_line1");
  const badge = fb("badge");
  const description = fb("description");
  const ctaPrimary = fb("cta_primary");
  const ctaSecondary = fb("cta_secondary");
  const titleLine2Raw = fb("title_line2");
  // Get typewriter words: use language translations if available, else fall back to site settings
  const typewriterWordsRaw = t("hero", "typewriter_words");
  const defaultWords = hero?.typewriter_words?.length ? hero.typewriter_words : DEFAULT_TYPEWRITER_WORDS;
  const words = typewriterWordsRaw
    ? typewriterWordsRaw.split(",").map((w: string) => w.trim()).filter(Boolean)
    : defaultWords;
  const typewriterText = useTypewriter(words);

  const titleLine2Template = titleLine2Raw.includes("{word}")
    ? titleLine2Raw
    : fallbacks.title_line2[lang] || fallbacks.title_line2.en;
  const line2Parts = titleLine2Template.split("{word}");
  const line2Before = line2Parts[0] || "";
  const line2After = line2Parts[1] || "";

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden gradient-bg">
      {/* Soft blue radial gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 55%, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.08) 35%, transparent 70%)",
        }}
      />
      {/* Soft animated background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-40 right-[10%] w-48 h-48 rounded-full bg-primary-lighter/8 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-32 left-[20%] w-56 h-56 rounded-full bg-primary-pale/6 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -8, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 right-[20%]"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-primary/20">
            <rect x="12" y="2" width="8" height="28" rx="2" fill="currentColor"/>
            <rect x="2" y="12" width="28" height="8" rx="2" fill="currentColor"/>
          </svg>
        </motion.div>
        <motion.div
          animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-48 left-[15%]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary/15">
            <circle cx="4" cy="4" r="2" fill="currentColor"/>
            <circle cx="12" cy="4" r="2" fill="currentColor"/>
            <circle cx="20" cy="4" r="2" fill="currentColor"/>
            <circle cx="4" cy="12" r="2" fill="currentColor"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="20" cy="12" r="2" fill="currentColor"/>
          </svg>
        </motion.div>
      </div>

      {/* Floating hospital domain icons */}
      <FloatingDomainIcons />

      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-primary/15 bg-primary/[0.06] text-primary text-[12px] sm:text-[13px] font-semibold mb-10 backdrop-blur-sm tracking-[0.01em] normal-case shadow-[0_1px_2px_hsl(var(--primary)/0.08)]"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15">
            <Bot className="w-3 h-3" strokeWidth={2.5} />
          </span>
          <span className="leading-none pt-px">{badge}</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] mb-8 tracking-[-0.035em] text-balance"
        >
          {titleLine1}
          <br />
          <span className="inline-flex items-baseline flex-wrap justify-center">
            {line2Before}<span className="text-gradient-primary mx-2">{typewriterText}</span><span className="inline-block w-[3px] h-[0.85em] bg-primary/70 animate-pulse ml-0.5 align-baseline rounded-sm" />{line2After}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg md:text-xl mb-10 leading-[1.7] font-normal text-pretty tracking-[-0.005em]"
        >
          {renderHighlighted(description, lang)}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16"
        >
          <Button variant="hero" size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-[15px] font-semibold tracking-[-0.01em]">
            {ctaPrimary} <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="hero-outline" size="lg" className="rounded-full px-8 w-full sm:w-auto hover:scale-[1.02] transition-all duration-300 text-[15px] font-semibold tracking-[-0.01em]">
            {ctaSecondary}
          </Button>
        </motion.div>

        {/* Chat Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="max-w-md mx-auto"
        >
          <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-coral" />
                <div className="w-3 h-3 rounded-full bg-amber" />
                <div className="w-3 h-3 rounded-full bg-emerald" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {lang === "ar" ? "مساعد البيانات الذكي" : "AI Data Assistant"}
              </span>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="p-4 min-h-[160px] flex flex-col justify-end gap-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="self-end bg-primary/10 text-foreground text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%]"
              >
                {lang === "ar"
                  ? "راجع أداء مؤشرات الأداء الرئيسية لقسم الطوارئ لشهر أبريل 2025"
                  : "Review the current KPI performance for Emergency Department (ED) for April 2025"}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="self-start flex items-center gap-2 text-muted-foreground text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <span className="flex items-center gap-1 font-medium">
                  {lang === "ar" ? "يكتب" : "Typing"}
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse-glow" />
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                  </span>
                </span>
              </motion.div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2.5">
                <span className="text-sm text-muted-foreground flex-1 font-medium">
                  {lang === "ar" ? "اسأل عن بيانات الرعاية الصحية..." : "Ask about your healthcare data..."}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

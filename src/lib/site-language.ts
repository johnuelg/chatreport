export type LocalizedValue = {
  en: string;
  ar: string;
};

export type SiteLanguageTranslations = {
  hero: {
    badge: LocalizedValue;
    title_line1: LocalizedValue;
    title_line2: LocalizedValue;
    typewriter_words: LocalizedValue;
    description: LocalizedValue;
    cta_primary: LocalizedValue;
    cta_secondary: LocalizedValue;
  };
  about: {
    title: LocalizedValue;
    description: LocalizedValue;
  };
  ai_features: {
    section_badge: LocalizedValue;
    section_title: LocalizedValue;
    section_description: LocalizedValue;
    chatbot_title: LocalizedValue;
    chatbot_description: LocalizedValue;
    report_title: LocalizedValue;
    report_description: LocalizedValue;
    document_title: LocalizedValue;
    document_description: LocalizedValue;
    dashboard_title: LocalizedValue;
    dashboard_description: LocalizedValue;
  };
  domains: {
    section_badge: LocalizedValue;
    section_title: LocalizedValue;
    section_description: LocalizedValue;
  };
  domain_cards: Record<string, LocalizedValue>;
  footer: {
    name: LocalizedValue;
    copyright: LocalizedValue;
  };
  login: {
    title: LocalizedValue;
    subtitle: LocalizedValue;
  };
};

export type SiteLanguageSettings = {
  default_language: "en" | "ar";
  translations: SiteLanguageTranslations;
};

export const defaultLanguageSettings: SiteLanguageSettings = {
  default_language: "en",
  translations: {
    hero: {
      badge: { en: "AI-Powered Healthcare Data Assistant", ar: "مساعد بيانات الرعاية الصحية المدعوم بالذكاء الاصطناعي" },
      title_line1: { en: "Chat with Your Data.", ar: "تحدث مع بياناتك." },
      title_line2: { en: "Get {word} Instantly.", ar: "احصل على {word} فوراً." },
      typewriter_words: {
        en: "Answers, Summaries, Charts, Reports, Insights",
        ar: "إجابات, ملخصات, رسوم بيانية, تقارير, رؤى"
      },
      description: {
        en: "Skip manual reports. Our personalized AI assistant performs instant analysis on your hospital KPI data, enabling fast decision-making.",
        ar: "تخطَّ التقارير اليدوية. يقوم مساعد الذكاء الاصطناعي بتحليل فوري لبيانات مؤشرات الأداء في مستشفاك."
      },
      cta_primary: { en: "Get Started", ar: "ابدأ الآن" },
      cta_secondary: { en: "Learn More", ar: "اعرف المزيد" },
    },
    about: {
      title: { en: "About Us", ar: "من نحن" },
      description: { en: "Providing intelligent healthcare data solutions.", ar: "نقدم حلول بيانات الرعاية الصحية الذكية." },
    },
    ai_features: {
      section_badge: { en: "Features", ar: "الميزات" },
      section_title: { en: "AI Features", ar: "ميزات الذكاء الاصطناعي" },
      section_description: {
        en: "We've got a new AI setup that's here to make life easier when it comes to tracking hospital KPIs. This tool helps you whip up reports automatically and lets you ask questions in plain language.",
        ar: "لدينا نظام ذكاء اصطناعي جديد يسهّل تتبع مؤشرات أداء المستشفى. يساعدك على إنشاء التقارير تلقائيًا وطرح الأسئلة بلغة بسيطة."
      },
      chatbot_title: { en: "AI-Powered Chatbot", ar: "روبوت محادثة مدعوم بالذكاء الاصطناعي" },
      chatbot_description: {
        en: "Got questions about hospital data or reports? Just ask and get smart insights right away!",
        ar: "هل لديك أسئلة حول بيانات المستشفى أو التقارير؟ فقط اسأل واحصل على إجابات ذكية فورًا!"
      },
      report_title: { en: "Automated Report Generation", ar: "إنشاء التقارير التلقائي" },
      report_description: {
        en: "Generate structured, high-quality reports automatically using AI, with an intuitive editor for review, customization, and approval.",
        ar: "أنشئ تقارير منظمة وعالية الجودة تلقائيًا باستخدام الذكاء الاصطناعي، مع محرر بديهي للمراجعة والتخصيص والموافقة."
      },
      document_title: { en: "Document Analysis", ar: "تحليل المستندات" },
      document_description: {
        en: "Simply chat with your PDFs to instantly find answers, generate summaries. Extracting key information for performance KPIs and operational insights.",
        ar: "تحدث مع ملفات PDF الخاصة بك للعثور على إجابات فورية وإنشاء ملخصات. استخراج المعلومات الأساسية لمؤشرات الأداء والرؤى التشغيلية."
      },
      dashboard_title: { en: "Customizable Dashboards", ar: "لوحات معلومات قابلة للتخصيص" },
      dashboard_description: {
        en: "Personalize dashboards tailored to different hospital domains. Visualize performance metrics, trends, and insights in one unified view.",
        ar: "خصص لوحات المعلومات لمختلف أقسام المستشفى. تصوّر مقاييس الأداء والاتجاهات والرؤى في عرض موحد."
      },
    },
    domains: {
      section_badge: { en: "Domains", ar: "الأقسام" },
      section_title: { en: "Hospital Domains", ar: "أقسام المستشفى" },
      section_description: {
        en: "Explore the different domains and departments within the hospital.",
        ar: "استكشف الأقسام والإدارات المختلفة داخل المستشفى."
      },
    },
    domain_cards: {
      ED: { en: "Emergency Department", ar: "قسم الطوارئ" },
      RAD: { en: "Radiology", ar: "الأشعة" },
      BB: { en: "Blood Bank", ar: "بنك الدم" },
      LAB: { en: "Laboratory", ar: "المختبر" },
      NICU: { en: "Neonatal Intensive Care Unit", ar: "وحدة العناية المركزة لحديثي الولادة" },
      PICU: { en: "Pediatric Intensive Care Unit", ar: "وحدة العناية المركزة للأطفال" },
      CPR: { en: "Cardiopulmonary Resuscitation", ar: "الإنعاش القلبي الرئوي" },
      Nursing: { en: "Nursing", ar: "التمريض" },
      HQI: { en: "Health Quality Index", ar: "مؤشر جودة الصحة" },
    },
    footer: {
      name: { en: "Taif Children's Hospital", ar: "مستشفى الطائف للأطفال" },
      copyright: { en: "© 2026 Taif Children's Hospital. Smart Reporting.", ar: "© 2026 مستشفى الطائف للأطفال. تقارير ذكية." },
    },
    login: {
      title: { en: "Healthcare Providers Login", ar: "تسجيل دخول مقدمي الرعاية الصحية" },
      subtitle: { en: "Sign in with your authorized credentials", ar: "قم بتسجيل الدخول باستخدام بيانات الاعتماد المعتمدة" },
    },
  },
};

export function mergeLanguageSettings(settings?: Partial<SiteLanguageSettings> | null): SiteLanguageSettings {
  const mergedTranslations = Object.fromEntries(
    Object.entries(defaultLanguageSettings.translations).map(([sectionKey, sectionValue]) => {
      if (sectionKey === "domain_cards") {
        const defaults = sectionValue as Record<string, LocalizedValue>;
        const incoming = settings?.translations?.domain_cards as Record<string, LocalizedValue> | undefined;
        const merged: Record<string, LocalizedValue> = {};
        // Merge defaults
        for (const [k, v] of Object.entries(defaults)) {
          merged[k] = { ...v, ...(incoming?.[k] ?? {}) };
        }
        // Add any extra keys from incoming
        if (incoming) {
          for (const [k, v] of Object.entries(incoming)) {
            if (!merged[k]) merged[k] = v;
          }
        }
        return [sectionKey, merged];
      }

      const incomingSection = settings?.translations?.[sectionKey as keyof SiteLanguageTranslations] as
        | Record<string, LocalizedValue>
        | undefined;

      return [
        sectionKey,
        Object.fromEntries(
          Object.entries(sectionValue).map(([fieldKey, fieldValue]) => [
            fieldKey,
            {
              ...fieldValue,
              ...(incomingSection?.[fieldKey] ?? {}),
            },
          ])
        ),
      ];
    })
  ) as SiteLanguageTranslations;

  return {
    default_language: settings?.default_language === "ar" ? "ar" : "en",
    translations: mergedTranslations,
  };
}
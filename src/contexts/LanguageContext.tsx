import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

// Keep a stable Context instance across Vite Fast Refresh/HMR.
// Otherwise, editing this file can recreate the Context and make consumers think there's no provider.
const __global = globalThis as typeof globalThis & {
  __tch_language_context__?: import("react").Context<LanguageContextType | undefined>;
};

const LanguageContext =
  __global.__tch_language_context__ ??
  (__global.__tch_language_context__ = createContext<LanguageContextType | undefined>(undefined));

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Landing Page
    "landing.hospitalName": "Taif Children's Hospital",
    "landing.platformName": "Conversational AI Data Platform",
    "landing.heroTitle": "Chat with Your Data. Get Reports Instantly.",
    "landing.heroLine1": "Chat with Your Data.",
    "landing.heroLine2Part1": "Get ",
    "landing.heroLine2Part2": " Instantly.",
    "landing.heroTitlePart1": "Chat with Your Data. Get",
    "landing.heroTitlePart2": "Instantly.",
    "landing.heroHighlight1": "Skip manual reports.",
    "landing.heroText1": " Our personalized AI assistant performs ",
    "landing.heroHighlight2": "instant analysis",
    "landing.heroText2": " on your hospital KPI data, enabling ",
    "landing.heroHighlight3": "fast decision-making.",
    "landing.heroText3": " By evaluating operational performance, it delivers the ",
    "landing.heroHighlight4": "answers,",
    "landing.heroText4": " ",
    "landing.heroHighlight5": "solutions,",
    "landing.heroText5": " and ",
    "landing.heroHighlight6": "insights",
    "landing.heroText6": " needed to optimize how your hospital operates. — ",
    "landing.heroHighlight7": "No spreadsheets.",
    "landing.heroText7": " ",
    "landing.heroHighlight8": "No delays.",
    "landing.login": "Login",
    "landing.getStarted": "Get Started",
    "landing.learnMore": "Learn More",
    "landing.badge": "AI-Powered Healthcare Data Assistant",
    
    // Navigation
    "nav.home": "Home",
    "nav.about": "About",
    "nav.features": "Features",
    "nav.teams": "Teams",
    "nav.ai": "AI",
    "nav.chatbot": "Chatbot",
    "nav.reportGeneration": "Report Generation",
    "nav.documentAnalysis": "Document Analysis",
    "nav.smartDataUploader": "Smart Data Uploader",
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat Assistant",
    "nav.bookmarks": "Bookmarks",
    "nav.documents": "Documents",
    "nav.users": "User Management",
    "nav.settings": "Settings",
    "nav.signOut": "Sign Out",
    
    // About Section
    "about.title": "About Our Platform",
    "about.description": "Our Conversational AI Data Platform strengthens data-driven decision-making at Taif Children's Hospital by transforming hospital KPIs and operational data into timely insights and automated reports. Powered by generative AI, the platform translates complex performance datasets into clear, actionable insights—enabling faster, more confident decisions across hospital operations.",
    "about.painPoints.title": "The Challenge",
    "about.painPoints.description": "Traditional manual report is time-consuming, error-prone, and creates operational bottlenecks across departments. Staff time is spent compiling and checking data, and preparing reports—rather than reviewing performance, improving processes, and running operations efficiently.",
    "about.solution.title": "Our Solution",
    "about.solution.description": "Simply chat with your data. Ask questions in natural language to get instant, reliable answers and automated performance reports from hospital operational data. Our generative AI interprets workflows and KPIs to deliver actionable insights in seconds.",
    
    // Features Section
    "features.title": "AI Features",
    "features.subtitle": "We've got a new AI setup that's here to make life easier when it comes to tracking hospital KPIs. This tool helps you whip up reports automatically and lets you ask questions in plain language. It gives quick access to performance insights, which cuts down on the manual work. This way, it helps everyone keep an eye on operations, improve quality, and support leadership reviews across all the different areas of the hospital.",
    "features.chatbot.title": "AI-Powered Chatbot",
    "features.chatbot.description": "Got questions about hospital data or reports? Just ask and get smart insights right away!",
    "features.reports.title": "Automated Report Generation",
    "features.reports.description": "Generate structured, high-quality reports automatically using AI, with an intuitive editor for review, customization, and approval.",
    "features.analysis.title": "Document Analysis",
    "features.analysis.description": "Simply chat with your PDFs to instantly find answers, generate summaries. Extracting key information for performance KPIs and operational insights is now faster, easier, and more intuitive than ever.",
    "features.dashboards.title": "Customizable Dashboards",
    "features.dashboards.description": "Personalize dashboards tailored to different hospital domains. Visualize performance metrics, trends, and insights in one unified view to support fast, informed decisions.",
    
    // Domains Section
    "domains.title": "Hospital Domains",
    "domains.subtitle": "Empowering every clinical service",
    "domains.ed": "Emergency Department",
    "domains.rad": "Radiology",
    "domains.bb": "Blood Bank",
    "domains.lab": "Laboratory",
    "domains.nicu": "Neonatal Intensive Care Unit",
    "domains.picu": "Pediatric Intensive Care Unit",
    "domains.cpr": "Cardiopulmonary Resuscitation",
    "domains.nursing": "Nursing",
    "domains.hqi": "Health Quality Index",
    
    // Navigation
    "nav.domains": "Domains",
    
    // Footer
    "footer.copyright": "© 2026 Taif Children's Hospital. Smart Reporting, Powered by Intelligent Chat.",
    
    // Common
    "common.loading": "Loading...",
    "common.search": "Search",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.close": "Close",
    
    // Auth
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full Name",
    "auth.forgotPassword": "Forgot Password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.welcomeBack": "Welcome Back",
    "auth.createAccount": "Create Account",
    "auth.signInDesc": "Sign in to access the ER Assistant",
    "auth.signUpDesc": "Create an account to get started",
    
    // Chat
    "chat.title": "ER Assistant",
    "chat.welcome": "Welcome to the ER Assistant",
    "chat.welcomeDesc": "I can help you analyze ER performance, find patient statistics, and answer questions about the department's data.",
    "chat.currentlyUsing": "Currently using",
    "chat.placeholder": "Ask me anything about ER data...",
    "chat.newChat": "New Chat",
    "chat.chatHistory": "Chat History",
    "chat.noHistory": "No chat history yet",
    "chat.startConversation": "Start a new conversation",
    "chat.poweredBy": "Powered by",
    "chat.askQuestions": "Ask questions about uploaded reports and ER data",
    "chat.model1": "Model 1",
    "chat.model2": "Model 2",
    "chat.regenerate": "Regenerate",
    "chat.copy": "Copy",
    "chat.bookmark": "Bookmark",
    "chat.sources": "Sources",
    
    // Dashboard
    "dashboard.title": "ER Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.overview": "Overview",
    
    // Documents
    "documents.title": "Documents",
    "documents.upload": "Upload Document",
    "documents.noDocuments": "No documents found",
    "documents.uploadFirst": "Upload your first document",
    
    // Bookmarks
    "bookmarks.title": "Bookmarks",
    "bookmarks.noBookmarks": "No bookmarks yet",
    "bookmarks.saveMessages": "Save important messages for quick access",
    
    // Users
    "users.title": "User Management",
    "users.addUser": "Add User",
    "users.role": "Role",
    
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.appearance": "Appearance",
    "settings.quickQuestions": "Quick Questions",
    "settings.dataManagement": "Data Management",
    "settings.selectLanguage": "Select Language",
    "settings.languageDesc": "Choose your preferred language for the application",
    
    // Languages
    "language.english": "English",
    "language.arabic": "العربية (Arabic)",
    
    // Header
    "header.appName": "TCH ER",
    "header.hospitalName": "Taif Children's",
    "header.hospitalNameAr": "مستشفى الطائف للأطفال",
  },
  ar: {
    // Landing Page
    "landing.hospitalName": "مستشفى الطائف للأطفال",
    "landing.platformName": "منصة البيانات بالذكاء الاصطناعي التحادثي",
    "landing.heroTitle": "تحدث مع بياناتك. احصل على التقارير فوراً.",
    "landing.heroLine1": "تحدث مع بياناتك.",
    "landing.heroLine2Part1": "احصل على ",
    "landing.heroLine2Part2": " فوراً.",
    "landing.heroTitlePart1": "تحدث مع بياناتك. احصل على",
    "landing.heroTitlePart2": "فوراً.",
    "landing.heroHighlight1": "تخطى التقارير اليدوية.",
    "landing.heroText1": " يقوم مساعد الذكاء الاصطناعي المخصص لدينا بإجراء ",
    "landing.heroHighlight2": "تحليل فوري",
    "landing.heroText2": " لبيانات مؤشرات الأداء في مستشفاك، مما يتيح ",
    "landing.heroHighlight3": "اتخاذ قرارات سريعة.",
    "landing.heroText3": " من خلال تقييم الأداء التشغيلي، يقدم ",
    "landing.heroHighlight4": "الإجابات،",
    "landing.heroText4": " ",
    "landing.heroHighlight5": "الحلول،",
    "landing.heroText5": " و",
    "landing.heroHighlight6": "الرؤى",
    "landing.heroText6": " اللازمة لتحسين طريقة عمل مستشفاك. — ",
    "landing.heroHighlight7": "بدون جداول بيانات.",
    "landing.heroText7": " ",
    "landing.heroHighlight8": "بدون تأخير.",
    "landing.login": "تسجيل الدخول",
    "landing.getStarted": "ابدأ الآن",
    "landing.learnMore": "اعرف المزيد",
    "landing.badge": "مساعد بيانات الرعاية الصحية بالذكاء الاصطناعي",
    
    // Navigation
    "nav.home": "الرئيسية",
    "nav.about": "عن المنصة",
    "nav.features": "المميزات",
    "nav.teams": "الفرق",
    "nav.ai": "الذكاء الاصطناعي",
    "nav.chatbot": "المحادثة الذكية",
    "nav.reportGeneration": "إنشاء التقارير",
    "nav.documentAnalysis": "تحليل المستندات",
    "nav.smartDataUploader": "رفع البيانات الذكي",
    "nav.dashboard": "لوحة التحكم",
    "nav.chat": "المساعد الذكي",
    "nav.bookmarks": "المفضلة",
    "nav.documents": "المستندات",
    "nav.users": "إدارة المستخدمين",
    "nav.settings": "الإعدادات",
    "nav.signOut": "تسجيل الخروج",
    
    // About Section
    "about.title": "عن منصتنا",
    "about.description": "تعزز منصة البيانات بالذكاء الاصطناعي التحادثي اتخاذ القرارات المستندة إلى البيانات في مستشفى الطائف للأطفال من خلال تحويل مؤشرات الأداء الرئيسية والبيانات التشغيلية إلى رؤى فورية وتقارير آلية. بفضل الذكاء الاصطناعي التوليدي، تترجم المنصة مجموعات بيانات الأداء المعقدة إلى رؤى واضحة وقابلة للتنفيذ — مما يتيح اتخاذ قرارات أسرع وأكثر ثقة عبر العمليات المستشفوية.",
    "about.painPoints.title": "التحدي",
    "about.painPoints.description": "إنشاء التقارير اليدوية التقليدية يستغرق وقتاً طويلاً، وعرضة للأخطاء، ويخلق اختناقات عبر الأقسام. يقضي الموظفون ساعات لا حصر لها في تجميع البيانات بدلاً من التركيز على رعاية المرضى.",
    "about.solution.title": "الحل",
    "about.solution.description": "ببساطة تحدث مع مستنداتك. اطرح أسئلة بلغة طبيعية واحصل على تقارير فورية ودقيقة. ذكاؤنا الاصطناعي يفهم المصطلحات الطبية وسير عمل المستشفى، ويقدم رؤى في ثوانٍ.",
    
    // Features Section
    "features.title": "مميزات الذكاء الاصطناعي",
    "features.subtitle": "لدينا نظام ذكاء اصطناعي جديد مصمم لتسهيل تتبع مؤشرات الأداء الرئيسية للمستشفى. تساعدك هذه الأداة على إنشاء التقارير تلقائياً وتتيح لك طرح الأسئلة بلغة بسيطة. توفر وصولاً سريعاً لرؤى الأداء، مما يقلل العمل اليدوي. بهذه الطريقة، تساعد الجميع على متابعة العمليات وتحسين الجودة ودعم مراجعات القيادة عبر جميع أقسام المستشفى المختلفة.",
    "features.chatbot.title": "روبوت محادثة بالذكاء الاصطناعي",
    "features.chatbot.description": "هل لديك أسئلة حول بيانات أو تقارير المستشفى؟ فقط اسأل واحصل على رؤى ذكية على الفور!",
    "features.reports.title": "إنشاء التقارير تلقائياً",
    "features.reports.description": "أنشئ تقارير منظمة وعالية الجودة تلقائياً باستخدام الذكاء الاصطناعي، مع محرر بديهي للمراجعة والتخصيص والموافقة.",
    "features.analysis.title": "تحليل المستندات",
    "features.analysis.description": "ببساطة تحدث مع ملفات PDF الخاصة بك للعثور على الإجابات فوراً وإنشاء الملخصات. استخراج المعلومات الرئيسية لمؤشرات الأداء والرؤى التشغيلية أصبح الآن أسرع وأسهل وأكثر سهولة من أي وقت مضى.",
    "features.dashboards.title": "لوحات تحكم قابلة للتخصيص",
    "features.dashboards.description": "خصص لوحات التحكم لتناسب أقسام المستشفى المختلفة. تصور مقاييس الأداء والاتجاهات والرؤى في عرض موحد لدعم القرارات السريعة والمستنيرة.",
    
    // Domains Section
    "domains.title": "أقسام المستشفى",
    "domains.subtitle": "تمكين كل خدمة سريرية",
    "domains.ed": "قسم الطوارئ",
    "domains.rad": "قسم الأشعة",
    "domains.bb": "بنك الدم",
    "domains.lab": "المختبر",
    "domains.nicu": "وحدة العناية المركزة لحديثي الولادة",
    "domains.picu": "وحدة العناية المركزة للأطفال",
    "domains.cpr": "الإنعاش القلبي الرئوي",
    "domains.nursing": "التمريض",
    "domains.hqi": "مؤشر جودة الصحة",
    
    // Navigation
    "nav.domains": "الأقسام",
    
    // Footer
    "footer.copyright": "© 2026 مستشفى الطائف للأطفال. تقارير ذكية، مدعومة بالمحادثة الذكية.",
    
    // Common
    "common.loading": "جاري التحميل...",
    "common.search": "بحث",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.add": "إضافة",
    "common.confirm": "تأكيد",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.submit": "إرسال",
    "common.close": "إغلاق",
    
    // Auth
    "auth.signIn": "تسجيل الدخول",
    "auth.signUp": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.fullName": "الاسم الكامل",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.hasAccount": "لديك حساب بالفعل؟",
    "auth.welcomeBack": "مرحباً بعودتك",
    "auth.createAccount": "إنشاء حساب جديد",
    "auth.signInDesc": "سجل الدخول للوصول إلى مساعد الطوارئ",
    "auth.signUpDesc": "أنشئ حساباً للبدء",
    
    // Chat
    "chat.title": "مساعد الطوارئ",
    "chat.welcome": "مرحباً بك في مساعد الطوارئ",
    "chat.welcomeDesc": "يمكنني مساعدتك في تحليل أداء قسم الطوارئ، والعثور على إحصائيات المرضى، والإجابة على الأسئلة المتعلقة ببيانات القسم.",
    "chat.currentlyUsing": "النموذج الحالي",
    "chat.placeholder": "اسألني أي شيء عن بيانات الطوارئ...",
    "chat.newChat": "محادثة جديدة",
    "chat.chatHistory": "سجل المحادثات",
    "chat.noHistory": "لا يوجد سجل محادثات",
    "chat.startConversation": "ابدأ محادثة جديدة",
    "chat.poweredBy": "مدعوم من",
    "chat.askQuestions": "اطرح أسئلة حول التقارير المرفوعة وبيانات الطوارئ",
    "chat.model1": "النموذج ١",
    "chat.model2": "النموذج ٢",
    "chat.regenerate": "إعادة التوليد",
    "chat.copy": "نسخ",
    "chat.bookmark": "إضافة للمفضلة",
    "chat.sources": "المصادر",
    
    // Dashboard
    "dashboard.title": "لوحة تحكم الطوارئ",
    "dashboard.welcome": "مرحباً بعودتك",
    "dashboard.overview": "نظرة عامة",
    
    // Documents
    "documents.title": "المستندات",
    "documents.upload": "رفع مستند",
    "documents.noDocuments": "لا توجد مستندات",
    "documents.uploadFirst": "ارفع مستندك الأول",
    
    // Bookmarks
    "bookmarks.title": "المفضلة",
    "bookmarks.noBookmarks": "لا توجد مفضلات",
    "bookmarks.saveMessages": "احفظ الرسائل المهمة للوصول السريع",
    
    // Users
    "users.title": "إدارة المستخدمين",
    "users.addUser": "إضافة مستخدم",
    "users.role": "الدور",
    
    // Settings
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.appearance": "المظهر",
    "settings.quickQuestions": "الأسئلة السريعة",
    "settings.dataManagement": "إدارة البيانات",
    "settings.selectLanguage": "اختر اللغة",
    "settings.languageDesc": "اختر لغتك المفضلة للتطبيق",
    
    // Languages
    "language.english": "English (الإنجليزية)",
    "language.arabic": "العربية",
    
    // Header
    "header.appName": "طوارئ الأطفال",
    "header.hospitalName": "مستشفى الطائف للأطفال",
    "header.hospitalNameAr": "Taif Children's Hospital",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  // Update document direction and lang attribute
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

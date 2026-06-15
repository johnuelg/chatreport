import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, ChevronDown, LogOut, Bot, FileText, BarChart3, Upload, Settings, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings, useIsAdmin } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { data: isAdmin } = useIsAdmin();
  const { lang, setLang } = useLanguage();
  const logo = settings?.logo;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const [isAIOpen, setIsAIOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setIsAIOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { en: "Home", ar: "الرئيسية", href: "#home" },
    { en: "About", ar: "عن المستشفى", href: "#about" },
    { en: "Features", ar: "المميزات", href: "#features" },
    { en: "Domains", ar: "الأقسام", href: "#domains" },
  ];

  const aiSubItems = [
    { en: "Chatbot", ar: "المحادثة الذكية", icon: Bot, href: "#chatbot" },
    { en: "Report Generation", ar: "إنشاء التقارير", icon: FileText, href: "#report-generation" },
    { en: "Document Analytics", ar: "تحليل المستندات", icon: BarChart3, href: "#document-analytics" },
    { en: "Smart Data Uploader", ar: "رفع البيانات الذكي", icon: Upload, href: "#smart-data-uploader" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {logo?.url ? (
            <img src={logo.url} alt={logo.alt} className="w-9 h-9 rounded-xl object-contain" />
          ) : (
            <img src="/images/hospital-logo.svg" alt="Taif Children's Hospital" className="w-9 h-9 rounded-xl object-contain" />
          )}
          <div className="flex flex-col leading-none">
            <span className="font-heading font-extrabold text-[15px] text-foreground tracking-[-0.02em]">
              {lang === "ar" ? "مستشفى الطائف للأطفال" : "Taif Children's Hospital"}
            </span>
            <span className="text-[11px] text-muted-foreground/90 mt-1 font-medium tracking-[0.01em]">
              {lang === "ar" ? "منصة الذكاء الاصطناعي للبيانات" : "Conversational AI Data Platform"}
            </span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.en}
              href={link.href}
              className="text-[14px] font-semibold text-muted-foreground hover:text-primary transition-colors duration-300 tracking-[-0.005em] relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {lang === "ar" ? link.ar : link.en}
            </a>
          ))}
          <div className="relative" ref={aiMenuRef}>
            <button
              onClick={() => setIsAIOpen(!isAIOpen)}
              className="text-[14px] font-semibold text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1 tracking-[-0.005em]"
            >
              {lang === "ar" ? "الذكاء الاصطناعي" : "AI"} <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAIOpen ? "rotate-180" : ""}`} />
            </button>
            {isAIOpen && (
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-56 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl py-2 animate-in fade-in-0 zoom-in-95 duration-200">
                {aiSubItems.map((item) => (
                  <a
                    key={item.en}
                    href={item.href}
                    onClick={() => setIsAIOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <item.icon className="w-4 h-4" />
                    {lang === "ar" ? item.ar : item.en}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/80 rounded-full p-1">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all duration-300 ${lang === "ar" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              AR
            </button>
          </div>
          {/* Theme Toggle */}
          <div className="hidden md:flex items-center gap-1 bg-secondary/80 rounded-full p-1">
            <button
              onClick={() => { if (isDark) toggleTheme(); }}
              className={`p-1.5 rounded-full transition-all duration-300 ${!isDark ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { if (!isDark) toggleTheme(); }}
              className={`p-1.5 rounded-full transition-all duration-300 ${isDark ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/admin")}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {user ? (
            <Button variant="hero" size="sm" className="rounded-full px-5 text-xs font-semibold" onClick={signOut}>
              <LogOut className="w-3 h-3 mr-1" /> {lang === "ar" ? "خروج" : "Logout"}
            </Button>
          ) : (
            <Button variant="hero" size="sm" className="rounded-full px-5 text-xs font-semibold" onClick={() => navigate("/admin/login")}>
              {lang === "ar" ? "دخول" : "Login"}
            </Button>
          )}
          <button
            className="md:hidden text-foreground p-1"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.en}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 py-2.5 px-3 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileOpen(false)}
              >
                {lang === "ar" ? link.ar : link.en}
              </a>
            ))}
            <div className="border-t border-border/50 pt-2 mt-1">
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest px-3 mb-1 block">
                {lang === "ar" ? "ميزات الذكاء الاصطناعي" : "AI Features"}
              </span>
              {aiSubItems.map((item) => (
                <a
                  key={item.en}
                  href={item.href}
                  className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 py-2.5 px-3 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {lang === "ar" ? item.ar : item.en}
                </a>
              ))}
            </div>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              <Globe className="w-4 h-4" />
              {lang === "en" ? "العربية (Arabic)" : "English"}
            </button>
            <button
              onClick={toggleTheme}
              className="text-sm font-medium text-muted-foreground hover:text-primary py-2.5 px-3 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Globe, MessageSquare, FileText, FileSearch, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import hospitalLogo from "@/assets/hospital-logo.png";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const LandingNavbar = () => {
  const { language, setLanguage, t, dir } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { key: "nav.home", href: "#home" },
    { key: "nav.about", href: "#about" },
    { key: "nav.features", href: "#features" },
    { key: "nav.domains", href: "#domains" },
  ];

  const aiSubLinks = [
    { key: "nav.chatbot", href: "#ai-chatbot", icon: MessageSquare },
    { key: "nav.reportGeneration", href: "#ai-reports", icon: FileText },
    { key: "nav.documentAnalysis", href: "#ai-analysis", icon: FileSearch },
    { key: "nav.smartDataUploader", href: "#ai-uploader", icon: Upload },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border dark:border-slate-700/50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Hospital Name */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            aria-label="Go to homepage"
          >
            <img 
              src={hospitalLogo} 
              alt="Taif Children's Hospital" 
              className="h-10 w-10 md:h-12 md:w-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(46,156,204,0.5)]"
            />
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-sm md:text-base text-foreground dark:text-white leading-tight transition-colors duration-300">
                {t("landing.hospitalName")}
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground dark:text-slate-400 leading-tight transition-colors duration-300">
                {t("landing.platformName")}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => scrollToSection(link.href)}
                className="px-4 py-2 text-sm font-medium text-foreground/80 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10"
              >
                {t(link.key)}
              </button>
            ))}
            
            {/* AI Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10">
                  {t("nav.ai")}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {aiSubLinks.map((link) => (
                  <DropdownMenuItem 
                    key={link.key}
                    onClick={() => scrollToSection(link.href)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <link.icon className="h-4 w-4 text-primary" />
                    {t(link.key)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher className="hidden sm:flex" />

            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="h-9 w-9"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
            </Button>

            {/* Login Button */}
            <Link to="/auth">
              <Button variant="default" size="sm" className="font-medium">
                {t("landing.login")}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border dark:border-slate-700/50 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-3 text-sm font-medium text-foreground/80 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg text-start transition-colors duration-300"
                >
                  {t(link.key)}
                </button>
              ))}
              
              {/* AI Section in Mobile */}
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">
                {t("nav.ai")}
              </div>
              {aiSubLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => scrollToSection(link.href)}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground/80 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg text-start transition-colors duration-300"
                >
                  <link.icon className="h-4 w-4 text-primary" />
                  {t(link.key)}
                </button>
              ))}
              
              {/* Theme Switcher in Mobile */}
              <div className="px-4 py-3 flex items-center justify-between sm:hidden">
                <span className="text-sm font-medium text-foreground/80 dark:text-slate-300 transition-colors duration-300">Theme</span>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;

import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useTypingAnimation } from "@/hooks/use-typing-animation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Stethoscope, Syringe, Heart, Activity, Pill, Thermometer, TestTube, Microscope } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedChatDemo from "./AnimatedChatDemo";

const HeroSection = () => {
  const { t, dir, language } = useLanguage();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation({ threshold: 0.1 });

  // Cycling words for typing animation
  const cyclingWordsEn = ["Answers", "Summaries", "Charts", "Reports", "Insights"];
  const cyclingWordsAr = ["إجابات", "ملخصات", "رسوم بيانية", "تقارير", "رؤى"];
  const cyclingWords = language === "ar" ? cyclingWordsAr : cyclingWordsEn;

  const { currentText, isNewWord } = useTypingAnimation({
    words: cyclingWords,
    typingSpeed: 100,
    deletingSpeed: 50,
    pauseDuration: 2000,
  });

  const scrollToFeatures = () => {
    const element = document.querySelector("#features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      ref={heroRef}
      id="home" 
      className={`relative min-h-screen flex items-center justify-center pt-20 overflow-hidden transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 dark:bg-accent/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating Hospital Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-icon absolute top-[10%] left-[5%] text-primary/20 dark:text-primary/40 animate-float transition-colors duration-300" style={{ animationDelay: "0s", animationDuration: "8s" }}>
          <Stethoscope className="h-8 w-8 md:h-12 md:w-12" />
        </div>
        <div className="floating-icon absolute top-[15%] right-[8%] text-primary/25 dark:text-primary/45 animate-float transition-colors duration-300" style={{ animationDelay: "1s", animationDuration: "7s" }}>
          <Heart className="h-6 w-6 md:h-10 md:w-10" />
        </div>
        <div className="floating-icon absolute top-[30%] left-[3%] text-primary/15 dark:text-primary/35 animate-float transition-colors duration-300" style={{ animationDelay: "2s", animationDuration: "9s" }}>
          <Activity className="h-7 w-7 md:h-11 md:w-11" />
        </div>
        <div className="floating-icon absolute top-[25%] right-[4%] text-primary/20 dark:text-primary/40 animate-float transition-colors duration-300" style={{ animationDelay: "0.5s", animationDuration: "6s" }}>
          <Syringe className="h-6 w-6 md:h-9 md:w-9" />
        </div>
        <div className="floating-icon absolute bottom-[35%] left-[6%] text-primary/20 dark:text-primary/40 animate-float transition-colors duration-300" style={{ animationDelay: "1.5s", animationDuration: "8s" }}>
          <Pill className="h-5 w-5 md:h-8 md:w-8" />
        </div>
        <div className="floating-icon absolute bottom-[40%] right-[5%] text-primary/25 dark:text-primary/45 animate-float transition-colors duration-300" style={{ animationDelay: "2.5s", animationDuration: "7s" }}>
          <Thermometer className="h-7 w-7 md:h-10 md:w-10" />
        </div>
        <div className="floating-icon absolute bottom-[25%] left-[8%] text-primary/15 dark:text-primary/35 animate-float transition-colors duration-300" style={{ animationDelay: "3s", animationDuration: "9s" }}>
          <TestTube className="h-6 w-6 md:h-9 md:w-9" />
        </div>
        <div className="floating-icon absolute bottom-[20%] right-[7%] text-primary/20 dark:text-primary/40 animate-float transition-colors duration-300" style={{ animationDelay: "0.8s", animationDuration: "6.5s" }}>
          <Microscope className="h-8 w-8 md:h-11 md:w-11" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center pt-16 md:pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 mb-10 animate-fade-in transition-colors duration-300">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">{t("landing.badge")}</span>
          </div>

          {/* Main Headline with Typing Animation - Two Lines */}
          <h1 className="font-poppins text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground dark:text-white mb-6 animate-slide-up flex flex-col items-center gap-2 md:gap-3 transition-colors duration-300">
            {/* Line 1: Chat with Your Data. */}
            <span className="leading-tight">{t("landing.heroLine1")}</span>
            {/* Line 2: Get [typewriter] Instantly. */}
            <span className="leading-tight">
              {t("landing.heroLine2Part1")}
              <span className="inline-flex items-baseline gap-0">
                <span 
                  className={`text-primary font-bold whitespace-nowrap transition-all duration-300 ease-out ${isNewWord ? 'animate-fade-in' : ''}`}
                  style={{ width: 'fit-content' }}
                >{currentText}</span>
                <span className="animate-blink text-primary">|</span>
              </span>
              {t("landing.heroLine2Part2")}
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="font-poppins text-lg md:text-xl text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto mb-10 animate-slide-up leading-[1.6] transition-colors duration-300" style={{ animationDelay: "0.1s" }}>
            <span className="font-bold text-glow">{t("landing.heroHighlight1")}</span>
            {t("landing.heroText1")}
            <span className="font-bold text-glow">{t("landing.heroHighlight2")}</span>
            {t("landing.heroText2")}
            <span className="font-bold text-glow">{t("landing.heroHighlight3")}</span>
            {t("landing.heroText3")}
            <span className="font-bold text-glow">{t("landing.heroHighlight4")}</span>
            {t("landing.heroText4")}
            <span className="font-bold text-glow">{t("landing.heroHighlight5")}</span>
            {t("landing.heroText5")}
            <span className="font-bold text-glow">{t("landing.heroHighlight6")}</span>
            {t("landing.heroText6")}
            <span className="font-bold text-glow">{t("landing.heroHighlight7")}</span>
            {t("landing.heroText7")}
            <span className="font-bold text-glow">{t("landing.heroHighlight8")}</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth">
              <Button size="lg" className="group px-8 py-6 text-base font-semibold shadow-elegant hover:shadow-glow transition-all duration-300">
                {t("landing.getStarted")}
                <ArrowRight className={`h-5 w-5 transition-transform group-hover:${dir === "rtl" ? "-translate-x-1" : "translate-x-1"}`} />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-base font-semibold dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors duration-300"
              onClick={scrollToFeatures}
            >
              {t("landing.learnMore")}
            </Button>
          </div>

          {/* Animated Chat Demo */}
          <div className="mt-16 md:mt-24 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <AnimatedChatDemo />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background dark:from-slate-900 to-transparent transition-colors duration-500" />
    </section>
  );
};

export default HeroSection;

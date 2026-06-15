import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { AlertTriangle, CheckCircle2, Zap, Clock, AlertCircle, Timer, Layers, MessageSquare, ShieldCheck, TrendingUp, Database } from "lucide-react";

const AboutSection = () => {
  const { t, dir } = useLanguage();
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section 
      ref={sectionRef}
      id="about" 
      className={`py-20 md:py-32 relative overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-primary/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 animate-slide-up">
              {t("about.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-loose text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {t("about.description")}
            </p>
          </div>

          {/* Pain Points vs Solution */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Pain Points Card */}
            <div className="group relative bg-card rounded-2xl p-8 lg:p-10 border border-destructive/20 shadow-soft hover:shadow-elegant hover:-translate-y-2 transition-all duration-500 animate-slide-up flex flex-col overflow-hidden" style={{ animationDelay: "0.2s" }}>
              {/* Hover background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-destructive/0 group-hover:border-destructive/20 transition-all duration-500" />
              <div className="relative z-10 flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-destructive/20 group-hover:rotate-3 transition-all duration-500">
                  <AlertTriangle className="h-6 w-6 text-destructive group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-destructive transition-colors duration-300">
                  {t("about.painPoints.title")}
                </h3>
              </div>
              <p className="relative z-10 text-muted-foreground leading-relaxed mb-8 text-left text-justify group-hover:text-foreground/80 transition-colors duration-300">
                {t("about.painPoints.description")}
              </p>
              <ul className="relative z-10 space-y-4 mt-auto">
                {[
                  { icon: Clock, text: dir === "rtl" ? "ساعات من العمل اليدوي لكل تقرير" : "Hours of manual work per report" },
                  { icon: AlertCircle, text: dir === "rtl" ? "عرضة للأخطاء البشرية" : "Prone to human errors" },
                  { icon: Timer, text: dir === "rtl" ? "تأخر في اتخاذ القرارات" : "Delayed decision making" },
                  { icon: Layers, text: dir === "rtl" ? "بيانات مبعثرة عبر الأقسام" : "Scattered data across departments" },
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-destructive" />
                      </div>
                      {item.text}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Solution Card */}
            <div className="group relative bg-card rounded-2xl p-8 lg:p-10 border border-primary/20 shadow-soft hover:shadow-elegant hover:-translate-y-2 transition-all duration-500 animate-slide-up flex flex-col overflow-hidden" style={{ animationDelay: "0.3s" }}>
              {/* Hover background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
              <div className="relative z-10 flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-3 transition-all duration-500">
                  <Zap className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {t("about.solution.title")}
                </h3>
              </div>
              <p className="relative z-10 text-muted-foreground leading-relaxed mb-8 text-left text-justify group-hover:text-foreground/80 transition-colors duration-300">
                {t("about.solution.description")}
              </p>
              <ul className="relative z-10 space-y-4 mt-auto">
                {[
                  { icon: MessageSquare, text: dir === "rtl" ? "تحدث لإنشاء تقارير أداء فورية" : "Chat to generate instant performance reports" },
                  { icon: ShieldCheck, text: dir === "rtl" ? "دقة مدعومة بالذكاء الاصطناعي يمكنك الوثوق بها" : "AI-driven accuracy you can trust" },
                  { icon: TrendingUp, text: dir === "rtl" ? "رؤى أداء في الوقت المناسب" : "Timely performance insights" },
                  { icon: Database, text: dir === "rtl" ? "جميع البيانات في مكان واحد. بدون عزل. بدون تكرار." : "All data in one place. No silos. No duplication." },
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-primary" />
                      </div>
                      {item.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

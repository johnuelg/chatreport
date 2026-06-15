import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { MessageSquare, FileText, FileSearch, LayoutDashboard } from "lucide-react";

const FeaturesSection = () => {
  const { t } = useLanguage();
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const features = [
    {
      icon: MessageSquare,
      titleKey: "features.chatbot.title",
      descKey: "features.chatbot.description",
      color: "primary",
      id: "ai-chatbot",
    },
    {
      icon: FileText,
      titleKey: "features.reports.title",
      descKey: "features.reports.description",
      color: "accent",
      id: "ai-reports",
    },
    {
      icon: FileSearch,
      titleKey: "features.analysis.title",
      descKey: "features.analysis.description",
      color: "blue-600",
      id: "ai-analysis",
    },
    {
      icon: LayoutDashboard,
      titleKey: "features.dashboards.title",
      descKey: "features.dashboards.description",
      color: "blue-700",
      id: "ai-uploader",
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className={`py-20 md:py-32 bg-background transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8 animate-slide-up">
              {t("features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-loose text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {t("features.subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.id}
                id={feature.id}
                className={`group relative bg-card rounded-2xl p-8 border border-border/50 shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
                style={{ 
                  transitionDelay: isVisible ? `${0.15 * index}s` : '0s',
                  transitionProperty: 'opacity, transform, box-shadow'
                }}
              >
                {/* Hover background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-[#2E9CCC]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2E9CCC]/20 group-hover:rotate-3 transition-all duration-500 ${
                    isVisible ? 'scale-100' : 'scale-75'
                  }`}
                  style={{ transitionDelay: isVisible ? `${0.15 * index + 0.1}s` : '0s' }}
                  >
                    <feature.icon className="h-7 w-7 text-[#2E9CCC] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

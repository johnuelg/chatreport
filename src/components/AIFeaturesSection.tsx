import { motion } from "framer-motion";
import { MessageSquare, FileText, FileSearch, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const featureKeys = [
  { icon: MessageSquare, titleKey: "chatbot_title", descKey: "chatbot_description", color: "primary" as const },
  { icon: FileText, titleKey: "report_title", descKey: "report_description", color: "teal" as const },
  { icon: FileSearch, titleKey: "document_title", descKey: "document_description", color: "amber" as const },
  { icon: LayoutGrid, titleKey: "dashboard_title", descKey: "dashboard_description", color: "coral" as const },
];

const colorMap = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal/10 text-teal",
  amber: "bg-amber/10 text-amber",
  coral: "bg-coral/10 text-coral",
};

const borderColorMap = {
  primary: "hover:border-primary/30",
  teal: "hover:border-teal/30",
  amber: "hover:border-amber/30",
  coral: "hover:border-coral/30",
};

const AIFeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            {t("ai_features", "section_badge") || "Features"}
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl mb-5 tracking-tight">
            {t("ai_features", "section_title") || "AI Features"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
            {t("ai_features", "section_description") || "We've got a new AI setup that's here to make life easier when it comes to tracking hospital KPIs."}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
          {featureKeys.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group ${borderColorMap[feature.color]}`}
            >
              <div className={`w-12 h-12 rounded-xl ${colorMap[feature.color]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base md:text-lg mb-2 tracking-tight">
                {t("ai_features", feature.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                {t("ai_features", feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIFeaturesSection;

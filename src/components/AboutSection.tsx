import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Clock, XCircle, TrendingDown, Database, MessageSquareText, CheckCircle2, Zap, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutSection = () => {
  const { lang, t } = useLanguage();

  const sectionLabel = lang === "ar" ? "من نحن" : "About Us";
  const heading = t("about", "title") || (lang === "ar" ? "عن منصتنا" : "About Our Platform");
  const description = t("about", "description") || (lang === "ar"
    ? "تعمل منصة الذكاء الاصطناعي للمحادثة على تعزيز اتخاذ القرارات المبنية على البيانات في مستشفى الطائف للأطفال من خلال تحويل مؤشرات الأداء والبيانات التشغيلية إلى رؤى فورية وتقارير آلية."
    : "Our Conversational AI Data Platform strengthens data-driven decision-making at Taif Children's Hospital by transforming hospital KPIs and operational data into timely insights and automated reports.");

  const challengeTitle = lang === "ar" ? "التحدي" : "The Challenge";
  const challengeDesc = lang === "ar"
    ? "إعداد التقارير اليدوية التقليدية يستغرق وقتاً طويلاً وعرضة للأخطاء ويخلق اختناقات تشغيلية عبر الأقسام."
    : "Traditional manual reporting is time-consuming, error-prone, and creates operational bottlenecks across departments.";
  const challengeItems = lang === "ar"
    ? [
        { icon: Clock, text: "ساعات من العمل اليدوي لكل تقرير" },
        { icon: XCircle, text: "عرضة للأخطاء البشرية" },
        { icon: TrendingDown, text: "تأخير في اتخاذ القرارات" },
        { icon: Database, text: "بيانات متفرقة عبر الأقسام" },
      ]
    : [
        { icon: Clock, text: "Hours of manual work per report" },
        { icon: XCircle, text: "Prone to human errors" },
        { icon: TrendingDown, text: "Delayed decision-making" },
        { icon: Database, text: "Scattered data across departments" },
      ];

  const solutionTitle = lang === "ar" ? "حلنا" : "Our Solution";
  const solutionDesc = lang === "ar"
    ? "تحدث مع بياناتك ببساطة. اطرح أسئلة بلغة طبيعية للحصول على إجابات فورية وموثوقة وتقارير أداء آلية."
    : "Simply chat with your data. Ask questions in natural language to get instant, reliable answers and automated performance reports.";
  const solutionItems = lang === "ar"
    ? [
        { icon: MessageSquareText, text: "تحدث لإنشاء تقارير أداء فورية" },
        { icon: CheckCircle2, text: "دقة مدعومة بالذكاء الاصطناعي" },
        { icon: Zap, text: "رؤى أداء في الوقت المناسب" },
        { icon: LayoutDashboard, text: "جميع البيانات في مكان واحد" },
      ]
    : [
        { icon: MessageSquareText, text: "Chat to generate instant performance reports" },
        { icon: CheckCircle2, text: "AI-driven accuracy you can trust" },
        { icon: Zap, text: "Timely performance insights" },
        { icon: LayoutDashboard, text: "All data in one place. No silos." },
      ];

  return (
    <section id="about" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-bold uppercase tracking-widest mb-4">{sectionLabel}</span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl mb-5 tracking-tight">{heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
            {description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
          {/* The Challenge */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-5 h-5 text-coral" />
              </div>
              <h3 className="font-heading font-bold text-lg md:text-xl">{challengeTitle}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
              {challengeDesc}
            </p>
            <div className="space-y-3">
              {challengeItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 text-sm text-muted-foreground font-medium"
                >
                  <item.icon className="w-4 h-4 text-coral/70 shrink-0" />
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Our Solution */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg md:text-xl">{solutionTitle}</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
              {solutionDesc}
            </p>
            <div className="space-y-3">
              {solutionItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 text-sm text-muted-foreground font-medium"
                >
                  <item.icon className="w-4 h-4 text-primary/70 shrink-0" />
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

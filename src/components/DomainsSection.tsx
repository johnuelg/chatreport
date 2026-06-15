import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useDomains } from "@/hooks/useDomains";
import { getIconComponent } from "@/components/admin/settings/DomainIconPicker";
import { useLanguage } from "@/contexts/LanguageContext";

const fallbackDomains = [
  { abbreviation: "ED", name: "Emergency Department", color: "#2f9acb", icon: "ambulance" },
  { abbreviation: "RAD", name: "Radiology", color: "#3ba5d2", icon: "scan-line" },
  { abbreviation: "BB", name: "Blood Bank", color: "#54b3d9", icon: "droplets" },
  { abbreviation: "LAB", name: "Laboratory", color: "#6dc2e0", icon: "microscope" },
  { abbreviation: "NICU", name: "Neonatal Intensive Care Unit", color: "#86d0e7", icon: "baby" },
  { abbreviation: "PICU", name: "Pediatric Intensive Care Unit", color: "#9fdded", icon: "activity" },
  { abbreviation: "CPR", name: "Cardiopulmonary Resuscitation", color: "#2f9acb", icon: "heart-pulse" },
  { abbreviation: "Nursing", name: "Nursing", color: "#3ba5d2", icon: "stethoscope" },
  { abbreviation: "HQI", name: "Health Quality Index", color: "#54b3d9", icon: "award" },
];

const useSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 50) => {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        dx < 0 ? onSwipeLeft() : onSwipeRight();
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return ref;
};

const DomainsSection = () => {
  const { data: dbDomains } = useDomains();
  const { t } = useLanguage();
  const domains = dbDomains && dbDomains.length > 0
    ? dbDomains.map(d => ({ abbreviation: d.abbreviation, name: d.name, color: d.color, icon: d.icon || "activity" }))
    : fallbackDomains;

  const itemsPerMobilePage = 3;
  const totalMobilePages = Math.ceil(domains.length / itemsPerMobilePage);
  const [mobilePage, setMobilePage] = useState(0);

  const itemsPerDesktopPage = 5;
  const totalDesktopPages = Math.ceil(domains.length / itemsPerDesktopPage);
  const [desktopPage, setDesktopPage] = useState(0);

  const mobileItems = domains.slice(mobilePage * itemsPerMobilePage, (mobilePage + 1) * itemsPerMobilePage);
  const desktopItems = domains.slice(desktopPage * itemsPerDesktopPage, (desktopPage + 1) * itemsPerDesktopPage);

  const mobileSwipeRef = useSwipe(
    useCallback(() => setMobilePage(p => Math.min(totalMobilePages - 1, p + 1)), [totalMobilePages]),
    useCallback(() => setMobilePage(p => Math.max(0, p - 1)), [])
  );

  const desktopSwipeRef = useSwipe(
    useCallback(() => setDesktopPage(p => Math.min(totalDesktopPages - 1, p + 1)), [totalDesktopPages]),
    useCallback(() => setDesktopPage(p => Math.max(0, p - 1)), [])
  );


  const DomainCard = ({ domain, index, size = "normal" }: { domain: typeof domains[0]; index: number; size?: "normal" | "large" }) => {
    const Icon = getIconComponent(domain.icon);
    const isLarge = size === "large";
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ delay: index * 0.06, duration: 0.35 }}
        className="flex flex-col items-center gap-2.5 group cursor-pointer"
      >
        <div
          className={`${isLarge ? "w-20 h-20" : "w-16 h-16"} rounded-2xl border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
          style={{ backgroundColor: `${domain.color}15` }}
        >
          <Icon className={`${isLarge ? "w-9 h-9" : "w-7 h-7"}`} style={{ color: domain.color }} />
        </div>
        <div className="text-center">
          <p className="font-heading font-bold text-sm">{domain.abbreviation}</p>
          <p className="text-[11px] text-muted-foreground leading-tight font-medium max-w-[100px]">
            {t("domain_cards", domain.abbreviation) || domain.name}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="domains" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            {t("domains", "section_badge") || "Domains"}
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl mb-2 tracking-tight">
            {t("domains", "section_title") || "Hospital Domains"}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            {t("domains", "section_description") || "Empowering every clinical service"}
          </p>
        </motion.div>

        <div className="block md:hidden">
          <div ref={mobileSwipeRef} className="min-h-[140px] touch-pan-y">
            <AnimatePresence mode="wait">
              <motion.div
                key={mobilePage}
                className="flex justify-center gap-6"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                {mobileItems.map((domain, i) => (
                  <DomainCard key={domain.abbreviation} domain={domain} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators + arrows */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setMobilePage(p => Math.max(0, p - 1))}
              disabled={mobilePage === 0}
              className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalMobilePages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobilePage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === mobilePage ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setMobilePage(p => Math.min(totalMobilePages - 1, p + 1))}
              disabled={mobilePage >= totalMobilePages - 1}
              className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <div ref={desktopSwipeRef} className="flex items-center justify-center gap-6">
            <button
              onClick={() => setDesktopPage(p => Math.max(0, p - 1))}
              disabled={desktopPage === 0}
              className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="min-h-[160px] flex items-start">
              <AnimatePresence mode="wait">
                <motion.div
                  key={desktopPage}
                  className="flex gap-10 justify-center"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.35 }}
                >
                  {desktopItems.map((domain, i) => (
                    <DomainCard key={domain.abbreviation} domain={domain} index={i} size="large" />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => setDesktopPage(p => Math.min(totalDesktopPages - 1, p + 1))}
              disabled={desktopPage >= totalDesktopPages - 1}
              className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop dots */}
          {totalDesktopPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalDesktopPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDesktopPage(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === desktopPage ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;

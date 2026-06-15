import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useRef, useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Ambulance, 
  Scan, 
  Droplets, 
  FlaskConical, 
  Baby, 
  HeartPulse, 
  Heart, 
  Stethoscope, 
  Award 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DomainsSection = () => {
  const { t, dir } = useLanguage();
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const domains = [
    { nameKey: "domains.ed", abbr: "ED", icon: Ambulance, color: "bg-red-500/10 text-red-500" },
    { nameKey: "domains.rad", abbr: "RAD", icon: Scan, color: "bg-blue-500/10 text-blue-500" },
    { nameKey: "domains.bb", abbr: "BB", icon: Droplets, color: "bg-rose-500/10 text-rose-500" },
    { nameKey: "domains.lab", abbr: "LAB", icon: FlaskConical, color: "bg-purple-500/10 text-purple-500" },
    { nameKey: "domains.nicu", abbr: "NICU", icon: Baby, color: "bg-pink-500/10 text-pink-500" },
    { nameKey: "domains.picu", abbr: "PICU", icon: HeartPulse, color: "bg-cyan-500/10 text-cyan-500" },
    { nameKey: "domains.cpr", abbr: "CPR", icon: Heart, color: "bg-orange-500/10 text-orange-500" },
    { nameKey: "domains.nursing", abbr: "Nursing", icon: Stethoscope, color: "bg-green-500/10 text-green-500" },
    { nameKey: "domains.hqi", abbr: "HQI", icon: Award, color: "bg-amber-500/10 text-amber-500" },
  ];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(Math.abs(scrollLeft) > 5);
      setCanScrollRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      const actualDirection = dir === "rtl" 
        ? (direction === "left" ? "right" : "left") 
        : direction;
      
      const newScrollLeft = actualDirection === "left" 
        ? scrollRef.current.scrollLeft - scrollAmount 
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
      
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="domains" 
      className={`py-16 md:py-24 lg:py-32 bg-secondary/30 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 animate-slide-up">
              {t("domains.title") || "Hospital Domains"}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: "0.1s" }}>
              {t("domains.subtitle") || "Specialized departments working together for excellence"}
            </p>
          </div>

          {/* Domains Slider */}
          <div className="relative">
            {/* Navigation Buttons - Hidden on mobile, shown on md+ */}
            {canScrollLeft && (
              <Button
                variant="outline"
                size="icon"
                className={`absolute ${dir === "rtl" ? "-right-3 md:-right-5" : "-left-3 md:-left-5"} top-1/2 -translate-y-1/2 z-10 bg-card shadow-md hover:shadow-lg hidden md:flex h-10 w-10`}
                onClick={() => scroll("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            {canScrollRight && (
              <Button
                variant="outline"
                size="icon"
                className={`absolute ${dir === "rtl" ? "-left-3 md:-left-5" : "-right-3 md:-right-5"} top-1/2 -translate-y-1/2 z-10 bg-card shadow-md hover:shadow-lg hidden md:flex h-10 w-10`}
                onClick={() => scroll("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {domains.map((domain, index) => (
                <div
                  key={domain.abbr}
                  className="flex-shrink-0 w-36 sm:w-44 md:w-52 lg:w-56 snap-center animate-slide-up"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  <div className="bg-card rounded-2xl p-4 sm:p-5 md:p-6 border border-border/50 shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 text-center h-full">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${domain.color} flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                      <domain.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-sm sm:text-base mb-1">
                      {domain.abbr}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {t(domain.nameKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile scroll indicator */}
            <div className="flex justify-center mt-4 md:hidden">
              <p className="text-xs text-muted-foreground">
                ← Swipe to explore →
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DomainsSection;

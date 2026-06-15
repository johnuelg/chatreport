import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import hospitalLogo from "@/assets/hospital-logo.png";

const FooterSection = () => {
  const { t } = useLanguage();
  const { ref: footerRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <footer 
      ref={footerRef}
      className={`py-12 bg-primary dark:bg-slate-900 text-white transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Hospital Name */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary dark:focus-visible:ring-offset-slate-900 rounded-lg"
            aria-label="Go to homepage"
          >
            <img 
              src={hospitalLogo} 
              alt="Taif Children's Hospital" 
              className="h-10 w-10 object-contain brightness-0 invert dark:brightness-100 dark:invert-0 dark:drop-shadow-[0_0_8px_rgba(46,156,204,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] dark:group-hover:drop-shadow-[0_0_12px_rgba(46,156,204,0.8)]"
            />
            <span className="font-display font-semibold text-sm text-white">
              {t("landing.hospitalName")}
            </span>
          </Link>

          {/* Copyright */}
          <p className="text-sm text-white/70 dark:text-slate-400 text-center transition-colors duration-300">
            {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

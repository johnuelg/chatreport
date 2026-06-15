import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Lock, Eye, EyeOff, Shield, Globe, Heart, Stethoscope, Pill, Syringe, Activity, Baby, Star } from "lucide-react";
import hospitalLogo from "@/assets/hospital-logo.png";
import authBackground from "@/assets/auth-background.svg";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

// Floating medical icon component - using darker blue tones to complement the background
const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  style 
}: { 
  icon: React.ElementType; 
  className?: string; 
  style?: React.CSSProperties;
}) => (
  <div 
    className={`absolute text-[#1a5f7a]/30 animate-float ${className}`}
    style={style}
  >
    <Icon className="w-full h-full drop-shadow-sm" />
  </div>
);

export default function Auth() {
  const navigate = useNavigate();
  const { language, setLanguage, dir } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isArabic = language === "ar";

  // Login page specific translations
  const t = {
    hospitalName: isArabic ? "مستشفى الطائف للأطفال" : "Taif Children's Hospital",
    hospitalNameSecondary: isArabic ? "Taif Children's Hospital" : "مستشفى الطائف للأطفال",
    heading: isArabic ? "تسجيل دخول مقدمي الرعاية الصحية" : "Healthcare Providers Login",
    subheading: isArabic ? "سجل الدخول باستخدام بيانات الاعتماد المعتمدة" : "Sign in with your authorized credentials",
    email: isArabic ? "البريد الإلكتروني" : "Email Address",
    emailPlaceholder: isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email",
    password: isArabic ? "كلمة المرور" : "Password",
    passwordPlaceholder: isArabic ? "أدخل كلمة المرور" : "Enter your password",
    rememberMe: isArabic ? "تذكرني" : "Remember me",
    signIn: isArabic ? "تسجيل الدخول" : "Sign In",
    securityNote: isArabic 
      ? "الوصول مقتصر على الموظفين المخولين فقط. تواصل مع المسؤول إذا كنت بحاجة إلى حساب."
      : "Access is restricted to authorized personnel only. Contact your administrator if you need an account.",
    footer: isArabic ? "مدعوم من نظام الذكاء الصحي بالطائف" : "Powered by Taif AI Healthcare Intelligence System",
    toggleLanguage: isArabic ? "English" : "العربية",
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/admin/landing");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/admin/landing");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(isArabic ? "تم تسجيل الدخول بنجاح" : "Signed in successfully");
    navigate("/admin/landing");
  };

  const toggleLanguage = () => {
    setLanguage(isArabic ? "en" : "ar");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#d1f3f8] relative overflow-hidden">
        {/* Background SVG - same as main view to prevent CLS */}
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${authBackground})`,
            transform: 'translateZ(0)',
          }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[#5ba3c0]/10" />
        </div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <img 
            src={hospitalLogo} 
            alt="Logo" 
            className="h-20 w-20 animate-float" 
            width={80}
            height={80}
          />
          <Loader2 className="h-6 w-6 animate-spin text-[#2f9acb]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex relative overflow-hidden bg-[#d1f3f8]" dir={dir}>
      {/* Background SVG - position fixed to prevent CLS, parent has fallback bg */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${authBackground})`,
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      >
        {/* Very subtle overlay for improved card contrast */}
        <div className="absolute inset-0 bg-[#5ba3c0]/10" />
      </div>

      {/* Language Toggle Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={toggleLanguage}
        className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 rounded-full px-3 py-1.5 font-sans text-sm transition-all duration-300 hover:scale-105"
      >
        <Globe className="h-4 w-4 mr-1.5" />
        {t.toggleLanguage}
      </Button>

      {/* Animated Floating Medical Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Heart icons */}
        <FloatingIcon 
          icon={Heart} 
          className="w-10 h-10 sm:w-14 sm:h-14" 
          style={{ top: '8%', left: '8%', animationDuration: '8s' }} 
        />
        <FloatingIcon 
          icon={Heart} 
          className="w-6 h-6 sm:w-8 sm:h-8" 
          style={{ bottom: '15%', right: '12%', animationDuration: '7s', animationDelay: '2s' }} 
        />
        
        {/* Stethoscope */}
        <FloatingIcon 
          icon={Stethoscope} 
          className="w-12 h-12 sm:w-16 sm:h-16" 
          style={{ top: '25%', right: '5%', animationDuration: '10s', animationDelay: '1s' }} 
        />
        
        {/* Pills */}
        <FloatingIcon 
          icon={Pill} 
          className="w-8 h-8 sm:w-10 sm:h-10" 
          style={{ bottom: '30%', left: '5%', animationDuration: '9s', animationDelay: '0.5s' }} 
        />
        <FloatingIcon 
          icon={Pill} 
          className="w-6 h-6" 
          style={{ top: '60%', right: '20%', animationDuration: '6s', animationDelay: '3s' }} 
        />
        
        {/* Syringe */}
        <FloatingIcon 
          icon={Syringe} 
          className="w-10 h-10 sm:w-12 sm:h-12" 
          style={{ top: '45%', left: '3%', animationDuration: '11s', animationDelay: '1.5s' }} 
        />
        
        {/* Activity/Pulse */}
        <FloatingIcon 
          icon={Activity} 
          className="w-12 h-12 sm:w-16 sm:h-16" 
          style={{ bottom: '10%', left: '25%', animationDuration: '8s', animationDelay: '2.5s' }} 
        />
        
        {/* Baby icon for children's hospital */}
        <FloatingIcon 
          icon={Baby} 
          className="w-10 h-10 sm:w-14 sm:h-14" 
          style={{ top: '12%', right: '25%', animationDuration: '9s', animationDelay: '0.8s' }} 
        />
        <FloatingIcon 
          icon={Baby} 
          className="w-8 h-8" 
          style={{ bottom: '25%', right: '30%', animationDuration: '7s', animationDelay: '3.5s' }} 
        />
        
        {/* Stars for child-friendly feel */}
        <FloatingIcon 
          icon={Star} 
          className="w-6 h-6 sm:w-8 sm:h-8" 
          style={{ top: '35%', left: '12%', animationDuration: '6s', animationDelay: '1.2s' }} 
        />
        <FloatingIcon 
          icon={Star} 
          className="w-5 h-5 sm:w-6 sm:h-6" 
          style={{ top: '70%', right: '8%', animationDuration: '5s', animationDelay: '2.8s' }} 
        />
        <FloatingIcon 
          icon={Star} 
          className="w-4 h-4 sm:w-5 sm:h-5" 
          style={{ bottom: '45%', left: '35%', animationDuration: '7s', animationDelay: '1.8s' }} 
        />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md animate-fade-in">
          {/* Logo & Hospital Name */}
          <div className="flex flex-col items-center mb-4 sm:mb-6 text-center">
            <div className="relative mb-2 sm:mb-3">
              <div className="absolute inset-0 bg-white/40 rounded-full blur-xl scale-125" />
              <img 
                src={hospitalLogo} 
                alt="Taif Children's Hospital" 
                className="relative h-16 w-16 sm:h-20 sm:w-20 animate-float drop-shadow-2xl"
                style={{ animationDuration: '5s' }}
                loading="lazy"
                width={80}
                height={80}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-0.5 drop-shadow-lg">
              {t.hospitalName}
            </h1>
            <p className="text-base sm:text-lg font-display text-white/90 drop-shadow-md">
              {t.hospitalNameSecondary}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 animate-slide-up border border-white/50" style={{ animationDelay: '0.2s' }}>
            {/* Card Header */}
            <div className="text-center mb-4 sm:mb-5">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2f9acb] to-[#6dc2e0] mb-2 sm:mb-3 shadow-lg">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#2f9acb]">
                {t.heading}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-sans">
                {t.subheading}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-gray-700 font-medium font-sans text-sm">
                  {t.email}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-10 sm:h-11 rounded-lg sm:rounded-xl border-[#b8e9f3] bg-[#f8fcfd] focus:border-[#2f9acb] focus:ring-[#2f9acb]/20 font-sans text-gray-700 placeholder:text-gray-400 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-gray-700 font-medium font-sans text-sm">
                  {t.password}
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`h-10 sm:h-11 rounded-lg sm:rounded-xl border-[#b8e9f3] bg-[#f8fcfd] focus:border-[#2f9acb] focus:ring-[#2f9acb]/20 font-sans text-gray-700 placeholder:text-gray-400 text-sm ${isArabic ? 'pl-10' : 'pr-10'}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-[#2f9acb] hover:bg-transparent ${isArabic ? 'left-1.5' : 'right-1.5'}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : (isArabic ? "إظهار كلمة المرور" : "Show password")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className={`flex items-center ${isArabic ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-[#9fdded] data-[state=checked]:bg-[#2f9acb] data-[state=checked]:border-[#2f9acb] h-4 w-4"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-xs sm:text-sm font-normal text-gray-500 cursor-pointer font-sans"
                >
                  {t.rememberMe}
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold font-sans shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#2f9acb] via-[#3ba5d2] to-[#54b3d9] hover:from-[#3ba5d2] hover:via-[#54b3d9] hover:to-[#6dc2e0]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t.signIn}
              </Button>
            </form>
            
            {/* Security Notice */}
            <div className="mt-4 sm:mt-5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[#f0fafc] border border-[#d1f3f8]">
              <p className="text-[10px] sm:text-xs text-center text-gray-500 font-sans flex items-center justify-center gap-1">
                <Shield className="h-3 w-3 text-[#6dc2e0] flex-shrink-0" />
                {t.securityNote}
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/90 text-xs sm:text-sm mt-3 sm:mt-4 font-sans animate-fade-in drop-shadow-md" style={{ animationDelay: '0.4s' }}>
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
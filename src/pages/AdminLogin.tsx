import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock, Globe, Heart, Star, Stethoscope, Baby, Syringe, Pill, Link2 } from "lucide-react";

type Lang = "en" | "ar";

const translations = {
  en: {
    title: "Healthcare Providers Login",
    subtitle: "Sign in with your authorized credentials",
    email: "Email Address",
    emailPlaceholder: "admin@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    signIn: "Sign In",
    signingIn: "Signing in...",
    notice: "Access is restricted to authorized personnel only. Contact your administrator if you need an account.",
    powered: "Powered by Taif AI Healthcare Intelligence System",
    denied: "Access Denied",
    deniedDesc: "You do not have an authorized role. Contact your administrator.",
    loginFailed: "Login Failed",
    welcome: "Welcome back!",
    langLabel: "العربية",
    hospitalName: "Taif Children's Hospital",
    hospitalNameAr: "مستشفى الطائف للأطفال",
  },
  ar: {
    title: "تسجيل دخول مقدمي الرعاية الصحية",
    subtitle: "قم بتسجيل الدخول باستخدام بيانات الاعتماد المعتمدة",
    email: "البريد الإلكتروني",
    emailPlaceholder: "admin@example.com",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    remember: "تذكرني",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول...",
    notice: "الوصول مقتصر على الموظفين المصرح لهم فقط. تواصل مع المسؤول إذا كنت بحاجة إلى حساب.",
    powered: "مدعوم من نظام الطائف للذكاء الاصطناعي في الرعاية الصحية",
    denied: "تم رفض الوصول",
    deniedDesc: "ليس لديك دور مصرح به. تواصل مع المسؤول.",
    loginFailed: "فشل تسجيل الدخول",
    welcome: "مرحباً بعودتك!",
    langLabel: "English",
    hospitalName: "Taif Children's Hospital",
    hospitalNameAr: "مستشفى الطائف للأطفال",
  },
};

const FloatingIcon = ({ icon: Icon, className }: { icon: any; className: string }) => (
  <div className={`absolute text-primary/20 ${className}`}>
    <Icon className="w-10 h-10" />
  </div>
);

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: settings } = useSiteSettings();

  const t = translations[lang];
  const isRtl = lang === "ar";

  // Get login page customization from site settings
  const loginSettings = (settings as any)?.login_page ?? {};
  const bgImage = loginSettings.bg_image || "/images/login-bg.png";
  const loginLogo = loginSettings.logo || "/images/hospital-logo.svg";
  const loginTitle = loginSettings.title_en || t.hospitalName;
  const loginTitleAr = loginSettings.title_ar || t.hospitalNameAr;

  useEffect(() => {
    if (session) {
      navigate("/admin/landing");
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login failed");

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: t.denied, description: t.deniedDesc, variant: "destructive" });
        return;
      }

      toast({ title: t.welcome });
      navigate("/admin/landing");
    } catch (error: any) {
      toast({ title: t.loginFailed, description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Floating medical icons */}
      <FloatingIcon icon={Heart} className="top-[10%] left-[10%]" />
      <FloatingIcon icon={Star} className="top-[15%] left-[14%]" />
      <FloatingIcon icon={Stethoscope} className="top-[8%] right-[5%]" />
      <FloatingIcon icon={Baby} className="top-[6%] right-[20%]" />
      <FloatingIcon icon={Syringe} className="top-[40%] left-[5%]" />
      <FloatingIcon icon={Pill} className="bottom-[30%] left-[7%]" />
      <FloatingIcon icon={Link2} className="top-[45%] right-[5%]" />
      <FloatingIcon icon={Star} className="bottom-[20%] right-[8%]" />
      <FloatingIcon icon={Heart} className="bottom-[15%] right-[15%]" />
      <FloatingIcon icon={Stethoscope} className="bottom-[25%] left-[12%]" />

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {t.langLabel}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
        {/* Logo & Hospital Name */}
        <div className="text-center mb-6">
          <img
            src={loginLogo}
            alt="Hospital Logo"
            className="w-20 h-20 mx-auto mb-3 object-contain"
          />
          <h1 className="text-2xl font-heading font-bold text-white drop-shadow-md">
            {loginTitle}
          </h1>
          <p className="text-white/90 text-base font-medium drop-shadow-sm" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
            {loginTitleAr}
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h2 className="text-center text-xl font-heading font-bold text-primary mb-1">
            {t.title}
          </h2>
          <p className="text-center text-sm text-black/60 mb-6">
            {t.subtitle}
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-black text-sm font-semibold">
                {t.email}
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-primary/5 border-primary/20 rounded-xl h-12 text-sm text-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-black text-sm font-semibold">
                {t.password}
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-primary/5 border-primary/20 rounded-xl h-12 text-sm pr-10 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="text-sm text-black/70 cursor-pointer">
                {t.remember}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.signingIn}
                </span>
              ) : (
                t.signIn
              )}
            </Button>
          </form>

          {/* Notice */}
          <div className="mt-5 flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <p className="text-xs text-black/60 leading-relaxed">
              {t.notice}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-4">
        <p className="text-white/80 text-sm drop-shadow-sm">
          {t.powered}
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

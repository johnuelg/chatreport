import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe } from "lucide-react";

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t("settings.selectLanguage")}
        </CardTitle>
        <CardDescription>
          {t("settings.languageDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as "en" | "ar")}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <RadioGroupItem value="en" id="lang-en" />
            <Label htmlFor="lang-en" className="flex items-center gap-2 cursor-pointer">
              <span className="text-lg">🇺🇸</span>
              {t("language.english")}
            </Label>
          </div>
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <RadioGroupItem value="ar" id="lang-ar" />
            <Label htmlFor="lang-ar" className="flex items-center gap-2 cursor-pointer">
              <span className="text-lg">🇸🇦</span>
              {t("language.arabic")}
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

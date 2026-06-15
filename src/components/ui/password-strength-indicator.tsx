import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Info, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { strength, requirements } = useMemo(() => {
    const reqs: Requirement[] = [
      { label: "At least 6 characters", met: password.length >= 6 },
      { label: "At least 8 characters (recommended)", met: password.length >= 8 },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains number", met: /[0-9]/.test(password) },
      { label: "Contains special character", met: /[^a-zA-Z0-9]/.test(password) },
    ];

    if (!password) return { strength: { score: 0, label: "", color: "" }, requirements: reqs };
    
    let score = 0;
    
    // Length checks
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Normalize to 0-4 scale
    const normalizedScore = Math.min(4, Math.floor(score / 1.75));
    
    const labels = ["Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-destructive",
      "bg-secondary",
      "bg-primary",
      "bg-accent",
    ];
    
    return {
      strength: {
        score: normalizedScore,
        label: labels[normalizedScore - 1] || "",
        color: colors[normalizedScore - 1] || ""
      },
      requirements: reqs
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        {strength.label && (
          <p
            className={cn(
              "text-xs",
              strength.score <= 1 && "text-destructive",
              strength.score === 2 && "text-muted-foreground",
              strength.score === 3 && "text-primary",
              strength.score === 4 && "text-foreground"
            )}
          >
            {strength.label}
          </p>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-medium mb-2">Password Requirements</p>
              <ul className="space-y-1">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

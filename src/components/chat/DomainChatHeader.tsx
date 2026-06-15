import { useState, useEffect } from "react";
import { 
  Globe, 
  Ambulance, 
  Droplets, 
  FlaskConical, 
  Scan, 
  Baby,
  HeartPulse,
  Heart,
  Stethoscope,
  Award,
  MessageSquare,
  type LucideIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Domain-specific icon mapping (matching landing page DomainsSection)
const getDomainIcon = (slug: string | undefined): LucideIcon => {
  if (!slug) return MessageSquare;
  
  const iconMap: Record<string, LucideIcon> = {
    'ed': Ambulance,              // Emergency Department
    'emergency': Ambulance,
    'emergency-department': Ambulance,
    'rad': Scan,                  // Radiology
    'radiology': Scan,
    'bb': Droplets,               // Blood Bank
    'blood-bank': Droplets,
    'lab': FlaskConical,          // Laboratory
    'laboratory': FlaskConical,
    'nicu': Baby,                 // NICU
    'picu': HeartPulse,           // PICU
    'cpr': Heart,                 // CPR
    'nursing': Stethoscope,       // Nursing
    'hqi': Award,                 // Health Quality Indicators (medal/ranking)
    'health-quality-index': Award,
    'clinical-audit': Award,
  };
  
  return iconMap[slug.toLowerCase()] || MessageSquare;
};

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation?: string | null;
}

interface DomainChatHeaderProps {
  domains: Domain[];
  selectedDomainId: string | null;
  onDomainChange: (domainId: string | null) => void;
}

export function DomainChatHeader({
  domains,
  selectedDomainId,
  onDomainChange,
}: DomainChatHeaderProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  // Trigger animation on domain change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [selectedDomainId]);

  const getTitle = () => {
    if (!selectedDomain) return "Data Assistant";
    return `${selectedDomain.name} Data Assistant`;
  };

  const getSubtitle = () => {
    if (!selectedDomain) {
      return "Ask questions about performance, reports, and analysis across all domains";
    }
    return `Ask questions about ${selectedDomain.name} performance, reports, and analysis`;
  };

  // Get the appropriate icon for the selected domain
  const DomainIcon = getDomainIcon(selectedDomain?.slug);

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "transition-all duration-300",
            isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          )}
        >
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2 flex-wrap">
            <DomainIcon 
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 transition-all duration-300",
                selectedDomain ? "text-primary" : "text-accent"
              )} 
              style={selectedDomain ? { color: selectedDomain.color } : undefined}
            />
            <span className="flex items-center gap-2">
              {getTitle()}
              {selectedDomain && (
                <span
                  className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full text-white"
                  style={{ backgroundColor: selectedDomain.color }}
                >
                  {selectedDomain.abbreviation || selectedDomain.slug.toUpperCase()}
                </span>
              )}
            </span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {getSubtitle()}
          </p>
        </div>
      </div>

      {/* Domain Selector */}
      <Select
        value={selectedDomainId || "all"}
        onValueChange={(value) => onDomainChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px] sm:w-[220px] lg:w-[260px] h-9 shrink-0">
          <Globe className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          <SelectValue placeholder="All Domains" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
              All Domains
            </div>
          </SelectItem>
          {domains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: domain.color }}
                />
                {domain.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

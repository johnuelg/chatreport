import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface DomainFilterProps {
  selectedDomain: string | null;
  onSelectDomain: (domainId: string | null) => void;
  domainCounts: Record<string, number>;
  userId?: string;
  isAdmin?: boolean;
}

export function DomainFilter({ selectedDomain, onSelectDomain, domainCounts, userId, isAdmin }: DomainFilterProps) {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    const fetchDomains = async () => {
      if (isAdmin || !userId) {
        // Admins see all domains
        const { data } = await supabase
          .from("domains")
          .select("id, name, slug, color")
          .order("display_order", { ascending: true });
        
        setDomains(data || []);
      } else {
        // Non-admins see only their assigned domains
        const { data } = await supabase
          .from("user_domains")
          .select("domain_id, domains(id, name, slug, color)")
          .eq("user_id", userId);
        
        if (data) {
          const userDomains = data
            .map((ud: any) => ud.domains)
            .filter(Boolean) as Domain[];
          setDomains(userDomains);
        } else {
          setDomains([]);
        }
      }
    };
    fetchDomains();
  }, [userId, isAdmin]);

  const totalCount = Object.values(domainCounts).reduce((sum, count) => sum + count, 0);
  const unassignedCount = domainCounts["unassigned"] || 0;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Domain</h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelectDomain(null)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
            selectedDomain === null
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <span>All</span>
          <Badge variant="secondary" className="ml-2">
            {totalCount}
          </Badge>
        </button>
        
        <button
          onClick={() => onSelectDomain("unassigned")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
            selectedDomain === "unassigned"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <span>Unassigned</span>
          <Badge variant="secondary" className="ml-2">
            {unassignedCount}
          </Badge>
        </button>

        {domains.map((domain) => (
          <button
            key={domain.id}
            onClick={() => onSelectDomain(domain.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
              selectedDomain === domain.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
              <span>{domain.name}</span>
            </div>
            <Badge variant="secondary" className="ml-2">
              {domainCounts[domain.id] || 0}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

interface DomainBadgeProps {
  domainId: string | null;
}

export function DomainBadge({ domainId }: DomainBadgeProps) {
  const [domain, setDomain] = useState<Domain | null>(null);

  useEffect(() => {
    if (!domainId) return;
    
    const fetchDomain = async () => {
      const { data } = await supabase
        .from("domains")
        .select("id, name, slug, color")
        .eq("id", domainId)
        .single();
      
      setDomain(data);
    };
    fetchDomain();
  }, [domainId]);

  if (!domainId || !domain) return null;

  return (
    <Badge
      style={{ backgroundColor: domain.color, color: "#fff" }}
      className="text-xs"
    >
      {domain.name}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

type DocumentCategory = 'ED' | 'BB' | 'LAB' | 'RAD' | 'CLINICAL_AUDIT' | 'HQI';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string }> = {
  ED: { label: 'ED', color: '#22c55e' },
  BB: { label: 'BB', color: '#ec4899' },
  LAB: { label: 'LAB', color: '#8b5cf6' },
  RAD: { label: 'RAD', color: '#f97316' },
  CLINICAL_AUDIT: { label: 'Clinical Audit', color: '#0ea5e9' },
  HQI: { label: 'HQI', color: '#eab308' },
};

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts: Record<string, number>;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryFilterProps) {
  const categories = Object.entries(CATEGORY_CONFIG) as [DocumentCategory, { label: string; color: string }][];

  return (
    <div className="space-y-2 mt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Category</h3>
      
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          selectedCategory === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="flex-1 text-left">All Categories</span>
      </button>

      <button
        onClick={() => onSelectCategory("uncategorized")}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          selectedCategory === "uncategorized"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="flex-1 text-left">Uncategorized</span>
        <span className="text-xs opacity-70">{categoryCounts["uncategorized"] || 0}</span>
      </button>

      {categories.map(([value, config]) => (
        <button
          key={value}
          onClick={() => onSelectCategory(value)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            selectedCategory === value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: config.color }}
          />
          <span className="flex-1 text-left">{config.label}</span>
          <span className="text-xs opacity-70">{categoryCounts[value] || 0}</span>
        </button>
      ))}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  
  const config = CATEGORY_CONFIG[category as DocumentCategory];
  if (!config) return null;

  return (
    <Badge 
      variant="outline" 
      className="text-xs shrink-0"
      style={{ 
        borderColor: config.color, 
        color: config.color,
        backgroundColor: `${config.color}10`
      }}
    >
      {config.label}
    </Badge>
  );
}

export { CATEGORY_CONFIG };
export type { DocumentCategory };
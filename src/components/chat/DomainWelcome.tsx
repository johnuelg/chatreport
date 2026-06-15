import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation?: string | null;
}

interface DomainWelcomeProps {
  selectedDomain: Domain | null;
  exampleQuestions: string[];
  onQuestionClick: (question: string) => void;
  modelName: string;
}

export function DomainWelcome({
  selectedDomain,
  exampleQuestions,
  onQuestionClick,
  modelName,
}: DomainWelcomeProps) {
  const getWelcomeMessage = () => {
    if (!selectedDomain) {
      return "Welcome to Data Assistant. I can help you with performance metrics, trend analysis, and operational insights across all domains.";
    }
    return `Welcome to ${selectedDomain.name} Assistant. I can help you with performance metrics, trend analysis, and operational insights.`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
      <div
        className={cn(
          "p-4 rounded-full mb-6 transition-colors duration-300",
          selectedDomain ? "" : "gradient-primary"
        )}
        style={
          selectedDomain
            ? { backgroundColor: selectedDomain.color }
            : undefined
        }
      >
        <Bot className="h-12 w-12 text-primary-foreground" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-display font-semibold text-foreground">
          {selectedDomain ? `${selectedDomain.name} Assistant` : "Data Assistant"}
        </h2>
        {selectedDomain && (
          <span
            className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full text-white"
            style={{ backgroundColor: selectedDomain.color }}
          >
            {selectedDomain.abbreviation || selectedDomain.slug.toUpperCase()}
          </span>
        )}
      </div>

      <p className="text-muted-foreground max-w-md mb-4">{getWelcomeMessage()}</p>

      <p className="text-xs text-muted-foreground mb-8">
        Currently using:{" "}
        <span className="font-medium text-foreground">{modelName}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {exampleQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className={cn(
              "p-3 text-left text-sm rounded-lg transition-all duration-200",
              "bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30",
              "hover:shadow-md"
            )}
          >
            <span className="text-muted-foreground">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

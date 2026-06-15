import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300",
        "border-2 shadow-inner",
        "hover:shadow-lg",
        isLight 
          ? "bg-gradient-to-r from-sky-100 via-sky-50 to-amber-50 border-sky-200 hover:shadow-amber-200/50" 
          : "bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-900 border-slate-600 hover:shadow-indigo-500/30",
        className
      )}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {/* Track icons - Sun on left, Moon on right */}
      <span 
        className={cn(
          "absolute left-1.5 transition-opacity duration-300",
          isLight ? "opacity-30" : "opacity-50"
        )}
      >
        <Sun className="h-4 w-4 text-amber-400" />
      </span>
      <span 
        className={cn(
          "absolute right-1.5 transition-opacity duration-300",
          isLight ? "opacity-50" : "opacity-30"
        )}
      >
        <Moon className="h-4 w-4 text-indigo-300" />
      </span>
      
      {/* Sliding knob */}
      <span
        className={cn(
          "absolute h-6 w-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
          "ring-2 ring-offset-1",
          isLight 
            ? "left-1 bg-gradient-to-br from-amber-400 to-orange-500 ring-amber-300 ring-offset-amber-50 shadow-amber-400/50" 
            : "left-8 bg-gradient-to-br from-indigo-500 to-blue-600 ring-indigo-400 ring-offset-slate-800 shadow-indigo-500/50"
        )}
      >
        {isLight ? (
          <Sun className="h-3.5 w-3.5 text-white drop-shadow-sm" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-white drop-shadow-sm" />
        )}
      </span>
    </button>
  );
};

export default ThemeSwitcher;

import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip transition on initial mount - render immediately for performance
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setDisplayChildren(children);
      return;
    }

    // Only transition on actual path change
    if (prevPathRef.current === location.pathname) {
      setDisplayChildren(children);
      return;
    }

    prevPathRef.current = location.pathname;
    setIsTransitioning(true);

    // Quick fade out, then swap content and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 75);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out",
        isTransitioning ? "opacity-0" : "opacity-100",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

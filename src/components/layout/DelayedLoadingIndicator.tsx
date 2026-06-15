import { useEffect, useState } from "react";

interface DelayedLoadingIndicatorProps {
  delay?: number;
}

export function DelayedLoadingIndicator({ delay = 300 }: DelayedLoadingIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIndicator(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!showIndicator) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted overflow-hidden">
      <div className="h-full w-1/3 bg-primary animate-[loading-bar_1s_ease-in-out_infinite]" />
    </div>
  );
}

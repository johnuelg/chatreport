import { useRef, useEffect, useState } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { usePreviewControls } from "./usePreviewControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TextPreviewContentProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

export function TextPreviewContent({
  url,
  fileName,
  onDownload,
}: TextPreviewContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    zoom,
    isFullscreen,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    handleWheel,
  } = usePreviewControls(100);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load file");
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error("Text preview error:", err);
        setError("Failed to load text content");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, toggleFullscreen]);

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        toggleFullscreen();
      } else {
        await document.exitFullscreen();
        toggleFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col h-full",
        isFullscreen && "bg-background"
      )}
      onWheel={handleWheel}
    >
      {/* Floating toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <PreviewToolbar
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onDownload={onDownload}
          showRotate={false}
        />
      </div>

      {/* Text content */}
      <ScrollArea className="flex-1 mt-16">
        <div
          className="p-4"
          style={{
            fontSize: `${zoom}%`,
          }}
        >
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-lg border">
            {content}
          </pre>
        </div>
      </ScrollArea>

      {/* Line count indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-background/80 rounded text-xs text-muted-foreground">
        {content.split("\n").length} lines • {zoom}%
      </div>
    </div>
  );
}

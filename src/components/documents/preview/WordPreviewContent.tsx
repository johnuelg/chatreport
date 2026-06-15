import { useRef, useEffect, useState } from "react";
import * as mammoth from "mammoth";
import { PreviewToolbar } from "./PreviewToolbar";
import { usePreviewControls } from "./usePreviewControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WordPreviewContentProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

export function WordPreviewContent({
  url,
  fileName,
  onDownload,
}: WordPreviewContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
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
        
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        if (result.messages.length > 0) {
          console.warn("Mammoth warnings:", result.messages);
        }
        
        setHtmlContent(result.value);
      } catch (err) {
        console.error("Word preview error:", err);
        setError("Failed to load Word document");
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
        <p className="text-muted-foreground">Converting document...</p>
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

      {/* Word document content */}
      <ScrollArea className="flex-1 mt-16">
        <div
          className="p-4"
          style={{
            fontSize: `${zoom}%`,
          }}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none bg-background p-6 rounded-lg border shadow-sm"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </ScrollArea>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-background/80 rounded text-xs text-muted-foreground">
        {zoom}%
      </div>
    </div>
  );
}

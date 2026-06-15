import { useRef, useEffect } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { usePreviewControls } from "./usePreviewControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PDFPreviewContentProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

export function PDFPreviewContent({
  url,
  fileName,
  onDownload,
}: PDFPreviewContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    zoom,
    isFullscreen,
    zoomIn,
    zoomOut,
    toggleFullscreen,
    handleWheel,
  } = usePreviewControls(100);

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

      {/* PDF viewer */}
      <ScrollArea className="flex-1 mt-16">
        <div
          className="flex items-start justify-center min-h-full p-4"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          <object
            data={`${url}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="w-full h-[80vh] rounded border bg-white"
            aria-label={fileName}
          >
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="w-full h-[80vh] rounded border bg-white"
              title={fileName}
            />
          </object>
        </div>
      </ScrollArea>
    </div>
  );
}

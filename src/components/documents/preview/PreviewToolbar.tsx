import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewToolbarProps {
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onDownload?: () => void;
  showZoom?: boolean;
  showRotate?: boolean;
  showFullscreen?: boolean;
  showDownload?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PreviewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  isFullscreen,
  onToggleFullscreen,
  onDownload,
  showZoom = true,
  showRotate = false,
  showFullscreen = true,
  showDownload = true,
  className,
  children,
}: PreviewToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg",
        className
      )}
    >
      {showZoom && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            disabled={zoom !== undefined && zoom <= 25}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          {zoom !== undefined && (
            <span className="min-w-[3rem] text-center text-sm font-medium">
              {zoom}%
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            disabled={zoom !== undefined && zoom >= 400}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </>
      )}

      {showRotate && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onRotateLeft}
            aria-label="Rotate left"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRotateRight}
            aria-label="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </>
      )}

      {children}

      {showFullscreen && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {showDownload && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            aria-label="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

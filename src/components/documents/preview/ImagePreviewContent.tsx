import { useRef, useEffect, useState, useCallback } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { usePreviewControls } from "./usePreviewControls";
import { cn } from "@/lib/utils";

interface ImagePreviewContentProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

export function ImagePreviewContent({
  url,
  fileName,
  onDownload,
}: ImagePreviewContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const {
    zoom,
    rotation,
    isFullscreen,
    zoomIn,
    zoomOut,
    setZoomLevel,
    rotateLeft,
    rotateRight,
    toggleFullscreen,
  } = usePreviewControls(100);

  // Handle fullscreen changes
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

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoomLevel(zoom + delta);
    },
    [zoom, setZoomLevel]
  );

  // Double click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (zoom === 100) {
      setZoomLevel(200);
    } else {
      setZoomLevel(100);
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom, setZoomLevel]);

  // Drag to pan when zoomed
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 100) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [zoom, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures for mobile
  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(null);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(100);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = getTouchDistance(e.touches);
        setTouchStartDistance(distance);
        setTouchStartZoom(zoom);
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistance !== null) {
        const currentDistance = getTouchDistance(e.touches);
        if (currentDistance !== null) {
          const scale = currentDistance / touchStartDistance;
          setZoomLevel(touchStartZoom * scale);
        }
      }
    },
    [touchStartDistance, touchStartZoom, setZoomLevel]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchStartDistance(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col h-full bg-muted/50",
        isFullscreen && "bg-black"
      )}
    >
      {/* Floating toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <PreviewToolbar
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onRotateLeft={rotateLeft}
          onRotateRight={rotateRight}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onDownload={onDownload}
          showRotate={true}
        />
      </div>

      {/* Image container */}
      <div
        className={cn(
          "flex-1 flex items-center justify-center overflow-hidden mt-16",
          zoom > 100 && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={url}
          alt={fileName}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-background/80 rounded text-xs text-muted-foreground">
        {zoom}% {rotation !== 0 && `• ${rotation}°`}
      </div>
    </div>
  );
}

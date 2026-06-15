import { useState, useCallback } from "react";

export interface PreviewControlsState {
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
}

export function usePreviewControls(initialZoom = 100) {
  const [zoom, setZoom] = useState(initialZoom);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 400));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 25));
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.min(Math.max(level, 25), 400));
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const resetRotation = useCallback(() => {
    setRotation(0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const fitToWindow = useCallback(() => {
    setZoom(100);
  }, []);

  const actualSize = useCallback(() => {
    setZoom(100);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom((prev) => Math.min(Math.max(prev + delta, 25), 400));
    }
  }, []);

  return {
    zoom,
    rotation,
    isFullscreen,
    zoomIn,
    zoomOut,
    setZoomLevel,
    rotateLeft,
    rotateRight,
    resetRotation,
    toggleFullscreen,
    fitToWindow,
    actualSize,
    handleWheel,
  };
}

import { useRef, useEffect, useState, useMemo } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { PreviewToolbar } from "./PreviewToolbar";
import { usePreviewControls } from "./usePreviewControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CodePreviewContentProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

// Map file extensions to Prism language identifiers
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",
    // Web
    html: "markup",
    htm: "markup",
    xml: "markup",
    svg: "markup",
    css: "css",
    scss: "css",
    sass: "css",
    less: "css",
    // Data
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    // Programming languages
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    // Shell
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    // Config
    dockerfile: "docker",
    makefile: "makefile",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    // Markdown
    md: "markdown",
    mdx: "markdown",
  };

  return languageMap[ext] || "plaintext";
};

export function CodePreviewContent({
  url,
  fileName,
  onDownload,
}: CodePreviewContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const language = useMemo(() => getLanguageFromFileName(fileName), [fileName]);

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
        console.error("Code preview error:", err);
        setError("Failed to load code content");
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

      {/* Code content with syntax highlighting */}
      <ScrollArea className="flex-1 mt-16">
        <div
          className="p-4"
          style={{
            fontSize: `${zoom}%`,
          }}
        >
          <Highlight theme={themes.vsDark} code={content} language={language}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={cn(className, "rounded-lg border overflow-x-auto")}
                style={{
                  ...style,
                  padding: "1rem",
                  margin: 0,
                  fontFamily: '"Fira Code", "Fira Mono", Consolas, monospace',
                  lineHeight: 1.6,
                }}
              >
                {tokens.map((line, i) => (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className="table-row"
                  >
                    <span className="table-cell pr-4 text-right select-none opacity-50 text-xs w-12">
                      {i + 1}
                    </span>
                    <span className="table-cell">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </ScrollArea>

      {/* Info indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-background/80 rounded text-xs text-muted-foreground">
        {language} • {content.split("\n").length} lines • {zoom}%
      </div>
    </div>
  );
}

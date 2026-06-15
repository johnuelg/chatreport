import { cn } from "@/lib/utils";

interface DashboardSkeletonProps {
  dir?: "ltr" | "rtl";
}

// Enhanced skeleton with shimmer effect
function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted skeleton-shimmer",
        className
      )}
    />
  );
}

export function DashboardSkeleton({ dir = "ltr" }: DashboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-background stable-height" dir={dir}>
      {/* Mobile Header Skeleton */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
            <div className="flex items-center gap-2">
              <ShimmerSkeleton className="h-9 w-9 rounded-full" />
              <ShimmerSkeleton className="h-5 w-20" />
            </div>
          </div>
          <ShimmerSkeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>

      {/* Sidebar Skeleton */}
      <aside
        className={cn(
          "hidden lg:block fixed top-0 h-screen w-72 bg-card/95 backdrop-blur-xl",
          dir === "rtl" ? "right-0 border-l border-border" : "left-0 border-r border-border"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Skeleton */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <ShimmerSkeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <ShimmerSkeleton className="h-5 w-32" />
                <ShimmerSkeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Navigation Skeleton */}
          <nav className="flex-1 p-4 space-y-1.5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <ShimmerSkeleton className="h-5 w-5 rounded" />
                <ShimmerSkeleton className="h-4 w-24" />
              </div>
            ))}
          </nav>

          {/* User Section Skeleton */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30">
              <ShimmerSkeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <ShimmerSkeleton className="h-4 w-32" />
                <ShimmerSkeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
            <ShimmerSkeleton className="w-full h-10 mt-3 rounded-xl" />
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main
        className={cn(
          "min-h-screen pt-16 lg:pt-0",
          dir === "rtl" ? "lg:mr-72" : "lg:ml-72"
        )}
      >
        <div className="p-6 lg:p-8 space-y-6">
          {/* Page Header Skeleton */}
          <div className="space-y-2">
            <ShimmerSkeleton className="h-8 w-48" />
            <ShimmerSkeleton className="h-4 w-72" />
          </div>

          {/* Content Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-card border border-border space-y-4"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <ShimmerSkeleton className="h-6 w-32" />
                <ShimmerSkeleton className="h-4 w-full" />
                <ShimmerSkeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

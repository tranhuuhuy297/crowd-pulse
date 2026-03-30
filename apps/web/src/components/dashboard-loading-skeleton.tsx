/** Reusable pulsing placeholder block */
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-gray-800 rounded animate-pulse ${className ?? ""}`} />;
}

/** Skeleton card matching a dashboard card's height */
function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      {children}
    </div>
  );
}

/** Full-layout pulse animation placeholders matching the dashboard structure */
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Top 3-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CrowdPulse score card */}
        <SkeletonCard>
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-32 w-32 rounded-full mx-auto" />
          <SkeletonBlock className="h-3 w-48 mx-auto" />
        </SkeletonCard>

        {/* Fear & Greed card */}
        <SkeletonCard>
          <SkeletonBlock className="h-4 w-40" />
          <div className="flex justify-between items-end">
            <SkeletonBlock className="h-12 w-16" />
            <SkeletonBlock className="h-8 w-24" />
          </div>
          <SkeletonBlock className="h-2.5 w-full rounded-full" />
          <div className="flex justify-between">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </SkeletonCard>

      </div>

      {/* Price grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-10" />
              <SkeletonBlock className="h-4 w-12" />
            </div>
            <SkeletonBlock className="h-6 w-28" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

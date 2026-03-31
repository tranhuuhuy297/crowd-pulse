function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded animate-pulse ${className ?? ""}`} style={{ background: "var(--bg-skeleton)" }} />;
}

function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2 backdrop-blur-sm" style={{ background: "var(--bg-card)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--bg-card-border)" }}>
      {children}
    </div>
  );
}

/** Loading skeleton matching the compact 3-section dashboard layout */
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Row 1: BTC Price hero */}
      <SkeletonCard>
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-3 w-14" />
          </div>
          <SkeletonBlock className="h-7 w-32 ml-4" />
          <div className="flex gap-4 ml-auto">
            <SkeletonBlock className="h-8 w-12" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        </div>
      </SkeletonCard>

      {/* Row 2: Score + Fear&Greed/LongShort */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 flex-1">
        <SkeletonCard>
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-28 w-28 rounded-full mx-auto" />
          <SkeletonBlock className="h-7 w-full rounded-lg" />
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <SkeletonBlock className="h-2.5 w-18" />
                <SkeletonBlock className="h-1.5 flex-1 rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <div className="flex flex-col gap-3">
          <SkeletonCard>
            <SkeletonBlock className="h-3 w-28" />
            <div className="flex justify-between items-end">
              <SkeletonBlock className="h-10 w-14" />
              <SkeletonBlock className="h-6 w-20" />
            </div>
            <SkeletonBlock className="h-2 w-full rounded-full" />
          </SkeletonCard>

          <SkeletonCard>
            <SkeletonBlock className="h-3 w-28" />
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-4 w-full rounded-full" />
            ))}
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

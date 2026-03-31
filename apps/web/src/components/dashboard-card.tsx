interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string;
}

const BASE_CLASSES = "relative rounded-xl backdrop-blur-sm overflow-visible hover:z-20 focus-within:z-20 transition-colors duration-200 hover-card";

const DEFAULT_STYLE: React.CSSProperties = {
  background: "var(--bg-card)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--bg-card-border)",
};

/** Shared card wrapper — replaces duplicated card chrome across all dashboard cards */
export function DashboardCard({ children, className = "", style, padding = "p-3" }: DashboardCardProps) {
  return (
    <div
      className={`${BASE_CLASSES} ${padding} ${className}`}
      style={{ ...DEFAULT_STYLE, ...style }}
    >
      {children}
    </div>
  );
}

import { Info } from "lucide-react";
import { useId } from "react";

interface InfoTooltipProps {
  content: string;
  placement?: "top" | "bottom" | "right";
}

const PLACEMENT_CLASSES = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

const ARROW_CLASSES = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-[var(--bg-card-border)]",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[var(--bg-card-border)]",
  right: "right-full top-1/2 -translate-y-1/2 border-r-[var(--bg-card-border)]",
} as const;

/** Inline info icon with hover/tap tooltip */
export function InfoTooltip({ content, placement = "top" }: InfoTooltipProps) {
  const id = useId();

  return (
    <span className="group/tip relative inline-flex items-center outline-none cursor-help" tabIndex={0} aria-describedby={id}>
      <Info size={14} style={{ color: "var(--text-muted)" }} className="shrink-0" />
      <span
        id={id}
        role="tooltip"
        className={`invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 group-focus/tip:visible group-focus/tip:opacity-100 absolute z-50 w-56 px-3 py-2 text-xs leading-relaxed rounded-lg border shadow-lg transition-all duration-150 pointer-events-none whitespace-normal text-left break-words ${PLACEMENT_CLASSES[placement]}`}
        style={{ background: "var(--bg-card)", borderColor: "var(--bg-card-border)", color: "var(--text-secondary)" }}
      >
        {content}
        <span className={`absolute w-0 h-0 border-4 border-transparent ${ARROW_CLASSES[placement]}`} />
      </span>
    </span>
  );
}

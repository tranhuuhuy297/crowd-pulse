interface Props {
  slugs: string[];
  current: string;
  onChange: (slug: string) => void;
}

/** Compact dropdown to switch between tracked crypto assets */
export function AssetSelectorDropdown({ slugs, current, onChange }: Props) {
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm font-bold px-2 py-1 rounded-md border cursor-pointer shrink-0"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        borderColor: "var(--border)",
      }}
    >
      {slugs.map((slug) => (
        <option key={slug} value={slug}>
          {slug.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

import type { TrackKind } from "@/lib/types";
import { trackLabel } from "@/lib/format";
import { cn } from "@/lib/date";

const STYLES: Record<TrackKind, string> = {
  cim: "bg-[#1d3a24] text-[#8fd19e] ring-[#2f5a3a]",
  kum: "bg-[#3a2c1a] text-[#e0b585] ring-[#5a4527]",
  sentetik: "bg-[#20303c] text-[#9dc4e0] ring-[#33505f]",
  diger: "bg-surface2 text-muted ring-border",
};

export function TrackBadge({ kind, label }: { kind: TrackKind; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1",
        STYLES[kind],
      )}
    >
      {trackLabel(kind, label)}
    </span>
  );
}

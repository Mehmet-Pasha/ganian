import { positionTone } from "@/lib/format";
import { cn } from "@/lib/date";

const TONE: Record<string, string> = {
  win: "bg-gold text-[#241a05] ring-gold2",
  place: "bg-[#c3c9d1] text-[#1c2126] ring-[#e2e6ea]",
  show: "bg-show text-[#241a05] ring-[#e0b585]",
  out: "bg-surface2 text-muted ring-border",
  none: "bg-transparent text-subtle ring-border/60",
};

export function PositionBadge({ pos }: { pos: string }) {
  const tone = positionTone(pos);
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular ring-1",
        TONE[tone],
      )}
      title={pos ? `${pos}. sırada bitirdi` : "Henüz koşmadı"}
    >
      {pos || "–"}
    </span>
  );
}

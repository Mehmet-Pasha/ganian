import { positionTone } from "@/lib/format";
import { cn } from "@/lib/date";

const DOT: Record<string, string> = {
  win: "bg-gold",
  place: "bg-[#c3c9d1]",
  show: "bg-show",
  out: "bg-subtle",
  none: "bg-border",
};

export function FormPips({ form }: { form: string[] }) {
  if (!form.length) return <span className="text-xs text-subtle">—</span>;
  return (
    <div className="flex items-center gap-1" title={`Son form: ${form.join(" ")}`}>
      {form.slice(0, 6).map((p, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-[3px] text-[9px] font-bold text-[#0b1a13]",
            DOT[positionTone(p)],
          )}
        >
          {/^\d+$/.test(p) && Number(p) <= 9 ? p : ""}
        </span>
      ))}
    </div>
  );
}

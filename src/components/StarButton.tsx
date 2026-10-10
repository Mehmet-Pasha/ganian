import { Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/date";

export function StarButton({ kind, id, name }: { kind: "at" | "jokey"; id: string; name: string }) {
  const { isFav, toggle } = useFavorites();
  const active = isFav(kind, id);
  return (
    <button
      type="button"
      onClick={() => toggle(kind, id, name)}
      aria-pressed={active}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full ring-1 transition-colors",
        active ? "bg-gold/15 text-gold ring-gold/40" : "text-muted ring-border hover:text-fg",
      )}
    >
      <Star className={cn("size-5", active && "fill-gold")} />
    </button>
  );
}

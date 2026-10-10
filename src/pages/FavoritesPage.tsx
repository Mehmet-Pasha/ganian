import { Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/lib/favorites";

export function FavoritesPage() {
  const { items, toggle } = useFavorites();
  const horses = items.filter((i) => i.kind === "at");
  const jockeys = items.filter((i) => i.kind === "jokey");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Favorilerim</p>
        <h1 className="mt-1 font-display text-4xl text-fg sm:text-5xl">Takip listem</h1>
        <p className="mt-1 text-muted">Bu cihazda saklanır. At ve jokey profillerindeki yıldız butonuyla ekleyip çıkarabilirsiniz.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-surface px-6 py-16 text-center ring-1 ring-border">
          <Star className="mx-auto size-8 text-subtle" />
          <p className="mt-3 font-display text-2xl">Henüz favori eklemediniz</p>
          <p className="mt-2 text-sm text-muted">Bir at veya jokey profilindeki yıldız ikonuna dokunun.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <FavGroup title="Atlar" items={horses} basePath="/at" onRemove={(id) => toggle("at", id, "")} />
          <FavGroup title="Jokeyler" items={jockeys} basePath="/jokey" onRemove={(id) => toggle("jokey", id, "")} />
        </div>
      )}
    </div>
  );
}

function FavGroup({
  title,
  items,
  basePath,
  onRemove,
}: {
  title: string;
  items: { id: string; name: string }[];
  basePath: string;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <h2 className="border-b border-border px-4 py-3 font-display text-xl">{title}</h2>
      <div className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <Link to={`${basePath}/${it.id}`} className="min-w-0 truncate text-sm text-fg hover:underline">
              {it.name || it.id}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(it.id)}
              aria-label="Favorilerden çıkar"
              className="shrink-0 text-subtle hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Skeleton } from "@/components/Skeleton";
import { getPersonProfile } from "@/lib/api";
import type { PersonProfile } from "@/lib/types";

const TITLE: Record<PersonProfile["kind"], string> = { antrenor: "Antrenör", sahip: "Sahip" };

export function PersonPage({ kind }: { kind: "antrenor" | "sahip" }) {
  const { id = "" } = useParams();
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPersonProfile(kind, id)
      .then((p) => alive && setPerson(p))
      .catch(() => alive && setPerson({ id, kind, name: "", horses: [], error: "Bilgi alınamadı" }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [kind, id]);

  if (loading || !person) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex h-11 items-center gap-2 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" />
        Program
      </Link>

      <header className="rounded-xl bg-surface p-5 ring-1 ring-border sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">{TITLE[kind]}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">{person.name || `${TITLE[kind]} ${id}`}</h1>
        {person.error ? <p className="mt-4 text-sm text-danger">{person.error}</p> : null}
      </header>

      <section className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
        <h2 className="border-b border-border px-4 py-3 font-display text-xl">
          İlişkili atlar
          <span className="ml-2 text-sm font-sans font-normal text-muted">{person.horses.length}</span>
        </h2>
        {person.horses.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            TJK sayfasında listelenen at bulunamadı. Bu kişiye ait atları görmek için ilgili atın profilinden ulaşabilirsiniz.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {person.horses.map((h) => (
              <Link key={h.id} to={`/at/${h.id}`} className="block px-4 py-3 text-sm text-fg hover:bg-surface2">
                {h.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

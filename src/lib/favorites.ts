import { useCallback, useEffect, useState } from "react";

type FavKind = "at" | "jokey";
type FavItem = { kind: FavKind; id: string; name: string };

const KEY = "mahmuz:favoriler";

function read(): FavItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Sadece beklenen şekle sahip kayıtları al, bozuk veriyi temizle
    return parsed.filter(
      (x): x is FavItem =>
        typeof x === "object" &&
        x !== null &&
        (x as FavItem).kind !== undefined &&
        ((x as FavItem).kind === "at" || (x as FavItem).kind === "jokey") &&
        typeof (x as FavItem).id === "string" &&
        typeof (x as FavItem).name === "string",
    );
  } catch {
    return [];
  }
}

function write(items: FavItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* depolama kullanılamıyor olabilir, sessizce yok say */
  }
}

export function useFavorites() {
  const [items, setItems] = useState<FavItem[]>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isFav = useCallback(
    (kind: FavKind, id: string) => items.some((i) => i.kind === kind && i.id === id),
    [items],
  );

  const toggle = useCallback((kind: FavKind, id: string, name: string) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.kind === kind && i.id === id);
      const next = exists ? prev.filter((i) => !(i.kind === kind && i.id === id)) : [...prev, { kind, id, name }];
      write(next);
      return next;
    });
  }, []);

  return { items, isFav, toggle };
}

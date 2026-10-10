import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getVideoUrl } from "@/lib/api";

export function VideoDialog({
  atId,
  kosuKod,
  fallbackUrl,
  title,
  onClose,
}: {
  atId: string;
  kosuKod: string;
  fallbackUrl?: string;
  title: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(fallbackUrl || "");
  const [page, setPage] = useState("");
  const [loading, setLoading] = useState(!fallbackUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    // Prop değiştiğinde önceki videoyu temizle, aksi halde eski video kısa süre görünür
    setUrl(fallbackUrl || "");
    setPage("");
    setError(false);
    setLoading(!!(atId && kosuKod) && !fallbackUrl ? true : !fallbackUrl ? !fallbackUrl : false);
    // atId/kosuKod yoksa ve fallback yoksa direkt hata göster
    if (!atId || !kosuKod) {
      setLoading(false);
      if (!fallbackUrl) setError(true);
      return () => {
        alive = false;
      };
    }
    if (atId && kosuKod) {
      setLoading(true);
      getVideoUrl(atId, kosuKod)
        .then((r) => {
          if (!alive) return;
          if (r.url) setUrl(r.url);
          else if (fallbackUrl) setUrl(fallbackUrl);
          setPage(r.page);
          if (!r.url && !fallbackUrl) setError(true);
        })
        .catch(() => {
          if (!alive) return;
          if (!fallbackUrl) setError(true);
        })
        .finally(() => alive && setLoading(false));
    }
    return () => {
      alive = false;
    };
  }, [atId, kosuKod, fallbackUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-xl bg-surface ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="truncate text-sm font-medium text-fg">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="shrink-0 text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-subtle">Video yükleniyor…</div>
          ) : error || !url ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-subtle">
              <p>Bu koşunun videosu şu anda alınamadı.</p>
              {page ? (
                <a
                  href={page}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-4 py-2 text-fg ring-1 ring-border hover:bg-surface"
                >
                  TJK sitesinde aç <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={url} controls autoPlay className="size-full" />
          )}
        </div>
      </div>
    </div>
  );
}

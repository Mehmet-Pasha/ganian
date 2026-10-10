import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="rounded-xl bg-surface px-6 py-20 text-center ring-1 ring-border">
      <p className="font-display text-6xl text-gold">404</p>
      <p className="mt-3 font-display text-2xl">Bu sayfa pistte yok</p>
      <p className="mt-2 text-sm text-muted">Aradığınız sayfa bulunamadı.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg hover:bg-gold hover:text-[#241a05]"
      >
        Programa dön
      </Link>
    </div>
  );
}

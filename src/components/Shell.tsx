import { Link, NavLink } from "react-router-dom";
import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { runningJobCount, subscribeJobs } from "@/lib/analysisRunner";
import { cn } from "@/lib/date";

const NAV = [
  { to: "/", label: "Program" },
  { to: "/sonuclar", label: "Sonuçlar" },
  { to: "/bot", label: "Bot" },
  { to: "/liderlik", label: "Liderlik" },
  { to: "/analizler", label: "Analizler" },
  { to: "/kuponlar", label: "Kuponlarım" },
  { to: "/favoriler", label: "Favorilerim" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-rail opacity-40" />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <LogoMark />
            <span className="font-display text-xl tracking-tight text-fg">Ganian</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-surface text-fg" : "text-muted hover:text-fg",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden flex-1 md:block md:max-w-xs md:ml-auto">
            <SearchBox />
          </div>

          <AnalysisBadge />

          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-full text-fg md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-bg px-4 py-4 md:hidden">
            <SearchBox onDone={() => setMobileOpen(false)} />
            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive ? "bg-surface text-fg" : "text-muted",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>

      <footer className="border-t border-border/70 px-4 py-10 text-center text-xs text-subtle">
        <p>
          Veriler Türkiye Jokey Kulübü (TJK) kaynaklarından derlenmektedir. Bahis oynamak için resmi e-Bayi
          platformunu kullanın.
        </p>
        <p className="mt-1">Ganian, TJK ile bağlantılı olmayan bağımsız bir bilgilendirme arayüzüdür.</p>
      </footer>
    </div>
  );
}

function AnalysisBadge() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeJobs(() => setTick((t) => t + 1)), []);
  const n = runningJobCount();
  if (!n) return null;
  return (
    <Link
      to="/analizler"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gold/15 px-3 text-xs font-medium text-gold ring-1 ring-gold/30 hover:bg-gold/25"
    >
      <Sparkles className="size-3.5 animate-pulse" />
      AI çalışıyor{n > 1 ? ` (${n})` : ""}
    </Link>
  );
}

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="#d8a94e" strokeWidth="1.5" />
      <path
        d="M9 20c1.5-5 4-9 7-9s5.5 4 7 9"
        stroke="#eef3ea"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="11" r="1.6" fill="#d8a94e" />
    </svg>
  );
}

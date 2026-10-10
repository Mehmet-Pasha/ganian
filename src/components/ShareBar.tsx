import { Printer, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url });
        return;
      } catch {
        // kullanıcı iptal etti ya da paylaşım desteklenmiyor, panoya kopyalamaya düş
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* panoya erişim yoksa sessizce geç */
    }
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={share}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm text-fg ring-1 ring-border hover:bg-surface2"
      >
        <Share2 className="size-4" />
        {copied ? "Bağlantı kopyalandı" : "Paylaş"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm text-fg ring-1 ring-border hover:bg-surface2"
      >
        <Printer className="size-4" />
        Yazdır
      </button>
    </div>
  );
}

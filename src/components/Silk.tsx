import { useState } from "react";

export function Silk({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface2 ring-1 ring-border text-subtle text-[10px]">
        —
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-8 shrink-0 rounded-full bg-surface2 object-contain ring-1 ring-border"
    />
  );
}

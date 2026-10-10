import { cn } from "@/lib/date";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface2", className)} />;
}

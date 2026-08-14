export default function Loading(): JSX.Element {
  return (
    <div role="status" aria-live="polite" aria-label="Loading radar">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-ink/10" />
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-ink/10" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-ink/10" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-ink/10" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-ink/10" />
      </div>
      <div className="h-[420px] w-full animate-pulse rounded-lg bg-ink/10" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
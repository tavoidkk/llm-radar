import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HistoryExplorer } from '@/components/HistoryExplorer';

export default function HistoryPage(): JSX.Element {
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-10">
      <nav className="mb-4 text-sm text-ink/60">
        <a href="/" className="underline-offset-4 hover:underline">← Live radar</a>
      </nav>
      <div className="flex items-center gap-3">
        <img src="/favicon.webp" alt="" width={32} height={32} className="neon-halo shrink-0" />
        <h1 className="neon-halo text-3xl font-bold tracking-tight">Model history</h1>
      </div>
      <p className="mt-2 text-ink/80">RF-2.2: Track how a model's speed, cost and intelligence evolved.</p>
      <div className="mt-8">
        <ErrorBoundary>
          <HistoryExplorer />
        </ErrorBoundary>
      </div>
    </main>
  );
}
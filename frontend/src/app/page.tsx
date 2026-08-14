import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RadarDashboard } from '@/components/RadarDashboard';

export default function HomePage(): JSX.Element {
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.webp" alt="" width={40} height={40} className="neon-halo shrink-0" />
          <div>
            <h1 className="neon-halo text-3xl font-bold tracking-tight">LLM Radar</h1>
            <p className="mt-2 text-ink/80">Real-Time AI Benchmarks Leaderboard</p>
          </div>
        </div>
        <nav className="text-sm">
          <a href="/history" className="rounded-md border border-ink/30 px-3 py-2 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            History →
          </a>
        </nav>
      </header>

      <div className="mt-8">
        <ErrorBoundary>
          <RadarDashboard />
        </ErrorBoundary>
      </div>
    </main>
  );
}
'use client';

export default function Error({ error: _error, reset }: { error: Error; reset: () => void }): JSX.Element {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Failed to load radar</h1>
      <p className="text-ink/70">You can try again.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-accent px-4 py-2 text-bg hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Try again
      </button>
    </main>
  );
}
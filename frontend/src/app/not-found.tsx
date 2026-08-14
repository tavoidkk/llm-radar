import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-ink/70">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        href="/"
        className="rounded-md bg-accent px-4 py-2 text-bg hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        Back to live radar
      </Link>
    </main>
  );
}
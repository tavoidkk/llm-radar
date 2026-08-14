import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LLM Radar — Real-Time AI Benchmarks Leaderboard',
  description: 'Compare LLMs by intelligence, speed and cost in real time.',
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-surface focus:px-3 focus:py-2">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
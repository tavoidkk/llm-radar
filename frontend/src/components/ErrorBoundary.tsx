'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string }): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <section
          role="alert"
          className="mx-auto max-w-md rounded-md border border-red-700 bg-red-950 p-6 text-ink"
        >
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-ink/80">{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 rounded-md border border-ink/30 px-3 py-2 text-sm hover:bg-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";
import { ErrorAnimation } from "../components/ErrorAnimation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isProd = process.env.NEXT_PUBLIC_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (isProd) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <ErrorAnimation />
        <h1 className="text-2xl font-bold mt-8 text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          We're sorry for the inconvenience. Our team has been notified and we're working to fix the issue.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            Development Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="font-mono text-sm text-red-600">
                {error.message || 'Failed to load tickets and projects'}
              </p>
              {error.stack && (
                <pre className="mt-4 p-4 bg-muted/50 rounded overflow-auto text-xs">
                  {error.stack}
                </pre>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={reset}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/90"
              >
                Reload page
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/shadcn/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'Failed to load tickets and projects'}
            </p>
            <button
              onClick={reset}
              className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
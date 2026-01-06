"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AwardErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Award page error:", error);
    }
  }, [error]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load award</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">
            We couldn&apos;t load the award details. The award may not exist or
            there was a problem with the server.
          </p>
          {process.env.NODE_ENV === "development" && error?.message && (
            <p className="mb-4 rounded bg-destructive/10 p-2 font-mono text-xs">
              {error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-3 w-3" />
                Back to awards
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

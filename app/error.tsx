"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Page error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              We encountered an error while loading this page. Please try again
              or return to the home page.
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
                  <Home className="h-3 w-3" />
                  Home
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

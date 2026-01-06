"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              padding: "1.5rem",
              border: "1px solid #ef4444",
              borderRadius: "0.5rem",
              backgroundColor: "#fef2f2",
            }}
          >
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                color: "#dc2626",
                fontSize: "1.125rem",
                fontWeight: 600,
              }}
            >
              Application Error
            </h2>
            <p
              style={{
                margin: "0 0 1rem 0",
                color: "#7f1d1d",
                fontSize: "0.875rem",
              }}
            >
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

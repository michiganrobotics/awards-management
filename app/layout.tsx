import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Robotics Award Nominations",
  description: "Track and manage award nominations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* SECURITY: Using Next.js Script component instead of dangerouslySetInnerHTML */}
        <Script id="dark-mode-detection" strategy="beforeInteractive">
          {`
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark')
            }
          `}
        </Script>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

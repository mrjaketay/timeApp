import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TimeTrack - NFC Time Tracking",
  description: "Modern time tracking with NFC cards and location tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <html lang="en">
      <head>
        {mapboxToken && (
          <Script
            src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
            strategy="lazyOnload"
          />
        )}
        {mapboxToken && (
          <link
            href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
            rel="stylesheet"
          />
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

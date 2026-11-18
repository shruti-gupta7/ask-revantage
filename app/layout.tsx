import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Ask Revantage", template: "%s | Ask Revantage" },
  description: "One question. One place. One answer.",
  icons: { icon: "/assets/favicon.png", apple: "/assets/favicon.png" },
  openGraph: {
    title: "Ask Revantage",
    description: "One question. One place. One answer.",
    type: "website",
    images: [{ url: "/assets/ask-revantage-og.png", width: 1200, height: 630, alt: "Ask Revantage" }]
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, colorScheme: "light dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}

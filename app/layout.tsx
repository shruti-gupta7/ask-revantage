import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Ask Revantage", template: "%s | Ask Revantage" },
  description: "A Revantage internal knowledge assistant powered by Microsoft Copilot Studio.",
  applicationName: "Ask Revantage",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    title: "Ask Revantage",
    description: "One question. One place. One answer.",
    siteName: "Ask Revantage",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Ask Revantage knowledge assistant" }],
  },
  twitter: { card: "summary_large_image", title: "Ask Revantage", description: "One question. One place. One answer.", images: ["/og-image.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f8fa" }, { media: "(prefers-color-scheme: dark)", color: "#0f172a" }] };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}

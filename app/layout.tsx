import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Ask Revantage",
  description: "Clear workplace answers from approved Revantage knowledge.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

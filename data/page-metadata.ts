import type { Metadata } from "next";

export type AppView = "ask" | "knowledge" | "people" | "admin";

const pageMetadata: Record<AppView, { title: string; description: string; path: string }> = {
  ask: {
    title: "Ask Revantage | Employee Policy Assistant",
    description: "Find clear workplace policy answers, verify source documents, and reach the right support team from one trusted experience.",
    path: "/",
  },
  knowledge: {
    title: "Knowledge Library | Ask Revantage",
    description: "Browse live document citations from Ask Revantage - Hackathon Knowledge Base with clear file types and document actions.",
    path: "/knowledge",
  },
  people: {
    title: "People Directory | Ask Revantage",
    description: "Search fictional hackathon contacts by department, location, or expertise and open Microsoft Teams chat targets when available.",
    path: "/people",
  },
  admin: {
    title: "Admin Dashboard | Ask Revantage",
    description: "Configure dynamic data sources, review Copilot Studio connection readiness, and manage knowledge integrations without seeded admin records.",
    path: "/admin",
  },
};

export function metadataFor(view: AppView): Metadata {
  const page = pageMetadata[view];
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      siteName: "Ask Revantage",
      title: page.title,
      description: page.description,
      url: page.path,
      images: [
        {
          url: "/og/ask-revantage.png",
          width: 1200,
          height: 630,
          alt: "Ask Revantage — One Question. One Place. One Answer.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/og/ask-revantage.png"],
    },
  };
}

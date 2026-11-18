import type { Metadata } from "next";

export type AppView = "ask" | "knowledge" | "routes" | "admin";

const pageMetadata: Record<AppView, { title: string; description: string; path: string }> = {
  ask: {
    title: "Ask Revantage | Employee Policy Assistant",
    description: "Find clear workplace policy answers, verify source documents, and reach the right support team from one trusted experience.",
    path: "/",
  },
  knowledge: {
    title: "Knowledge Library | Ask Revantage",
    description: "Explore the workplace policy documents and approved answer sections available to Ask Revantage.",
    path: "/knowledge",
  },
  routes: {
    title: "Support Routes | Ask Revantage",
    description: "Meet the named department contacts who receive questions when an answer needs human support.",
    path: "/support",
  },
  admin: {
    title: "Admin Overview | Ask Revantage",
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

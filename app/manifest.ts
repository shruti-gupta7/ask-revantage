import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ask Revantage",
    short_name: "Ask Revantage",
    description: "One question. One place. One answer.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2ECE8",
    theme_color: "#031730",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

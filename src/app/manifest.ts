import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GitBrag",
    short_name: "GitBrag",
    description: "Show off your open-source contributions.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfa",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "일산골프모임",
    short_name: "일산골프",
    description: "일산골프모임 스코어 관리",
    start_url: "/",
    display: "standalone",
    background_color: "#064e3b",
    theme_color: "#064e3b",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

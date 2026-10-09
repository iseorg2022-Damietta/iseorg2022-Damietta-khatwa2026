import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "منصة د. عبد الناصر أنيس عبد الوهاب للكشف المبكر والإحالة للتدخل",
    short_name: "خطوة",
    description: "رصد النمو من الجنين حتى 6 سنوات — كشف مبكر، إحالة، تدخل",
    start_url: "/dashboard", scope: "/",
    display: "standalone", orientation: "portrait",
    dir: "rtl", lang: "ar",
    background_color: "#fafaf9", theme_color: "#0E5A6D",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
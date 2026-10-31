import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "https://sovereign-e-commerce-store.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/account",
          "/auth",
          "/track",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
        ],
        allow: ["/", "/shop", "/product/", "/about", "/care/"],
        disallow: ["/admin/", "/api/", "/checkout", "/account"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}


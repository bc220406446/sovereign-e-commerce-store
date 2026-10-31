import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "https://sovereign-e-commerce-store.vercel.app";

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Customer Care & Policy Hub
    {
      url: `${siteUrl}/care/faqs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/care/warranty`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/care/shipping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/care/returns`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/care/payment`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/care/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/care/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Dynamic Product Pages
      const { data: products } = await supabase
        .from("products")
        .select("slug, created_at")
        .eq("status", "active");

      if (products && products.length > 0) {
        const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
          url: `${siteUrl}/product/${product.slug}`,
          lastModified: product.created_at ? new Date(product.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        }));
        dynamicRoutes.push(...productRoutes);
      }

      // 2. Dynamic Category Pages
      const { data: categories } = await supabase
        .from("categories")
        .select("slug");

      if (categories && categories.length > 0) {
        const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
          url: `${siteUrl}/shop?category=${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        }));
        dynamicRoutes.push(...categoryRoutes);
      }
    } catch (error) {
      console.error("Error fetching dynamic sitemap entries:", error);
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}

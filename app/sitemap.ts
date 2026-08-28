import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/automatisations", "/integrations", "/securite", "/tarifs", "/affiliation", "/a-propos", "/investisseurs", "/ressources"];
  return routes.map((route) => ({ url: `https://nova.ai${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : 0.8 }));
}

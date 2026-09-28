import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/constants";

const PATHS = ["", "/privacy", "/terms", "/refund-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now
  }));
}

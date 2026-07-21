import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/constants";

const PATHS = ["", "/privacy", "/terms", "/refund-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PATHS.flatMap((path) => [
    {
      url: `${SITE_URL}${path}`,
      lastModified: now,
      alternates: {
        languages: {
          en: `${SITE_URL}${path}`,
          tr: `${SITE_URL}/tr${path}`
        }
      }
    },
    {
      url: `${SITE_URL}/tr${path}`,
      lastModified: now,
      alternates: {
        languages: {
          en: `${SITE_URL}${path}`,
          tr: `${SITE_URL}/tr${path}`
        }
      }
    }
  ]);
}

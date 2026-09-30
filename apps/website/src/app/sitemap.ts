import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/constants";

const PATHS = ["", "/privacy", "/terms", "/refund-policy", "/delete-account"];
const LOCALE_PREFIXES = ["", "/en"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return LOCALE_PREFIXES.flatMap((prefix) =>
    PATHS.map((path) => ({
      url: `${SITE_URL}${prefix}${path}`,
      lastModified: now
    }))
  );
}

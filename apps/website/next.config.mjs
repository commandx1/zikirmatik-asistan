import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Site geçici olarak yalnız TR: eski /tr/* ve /en/* adresleri köke.
  // EN uygulama lansmanında routing.locales'e "en" eklenince /en satırı kalkar.
  async redirects() {
    return [
      { source: "/tr", destination: "/", permanent: true },
      { source: "/tr/:path*", destination: "/:path*", permanent: true },
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true }
    ];
  }
};

export default withNextIntl(nextConfig);

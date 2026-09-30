import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // TR varsayılan dil ve köktedir: eski /tr/* adresleri köke yönlenir.
  // /en/* artık gerçek İngilizce sayfalardır, yönlendirilmez.
  async redirects() {
    return [
      { source: "/tr", destination: "/", permanent: true },
      { source: "/tr/:path*", destination: "/:path*", permanent: true }
    ];
  }
};

export default withNextIntl(nextConfig);

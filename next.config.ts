import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev sunucusu `/_next/*` kaynaklarina kendi host'u disindan gelen istekleri
   * varsayilan olarak 403 ile bloke eder. Traefik arkasinda tarayici bu domaini
   * kullandigi icin dinamik import chunk'lari (Origin basligiyla istenir)
   * engellenir; sayfa SSR ile gelir ama istemci bilesenleri hic mount olmaz.
   * Sadece `next dev` icin gecerli, production build'i etkilemez.
   */
  allowedDevOrigins: ["gym.test"],

  output: "standalone",
};

export default nextConfig;

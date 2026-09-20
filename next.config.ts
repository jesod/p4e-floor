import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  // Las rutas nacieron en español. La app pasó a inglés, pero los links que ya
  // circulan tienen que seguir funcionando.
  async redirects() {
    return [
      { source: "/perfil", destination: "/profile", permanent: true },
      { source: "/ruta", destination: "/route", permanent: true },
      { source: "/plano", destination: "/floor", permanent: true },
      { source: "/fuentes", destination: "/sources", permanent: true },
    ];
  },
};

export default nextConfig;

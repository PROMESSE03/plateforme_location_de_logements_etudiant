import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev depuis le réseau local (ex: un téléphone
  // sur http://192.168.x.x:3002). Sans ça, Next bloque ses scripts de dev et la
  // page reste figée sur « Chargement ».
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;

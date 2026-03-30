import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/crowd-pulse/",
  plugins: [react(), tailwindcss()],
  server: { port: 5177 },
  build: { outDir: "dist" },
});

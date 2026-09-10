import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "superdev-tagger";
import { superdevCompileCheck } from "./plugins/superdev-compile-check";

process.env.SUPERDEV_SANDBOX = "true";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api/integrations": {
        target: "https://superdev.build",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/integrations/, "/api/integrations"),
      },
    },
    hmr:
      process.env.BUILDY_WORKSPACE_PROVIDER === "vercel-sandbox"
        ? false
        : { overlay: false },
  },
  plugins: [
    react(),
    superdevCompileCheck(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["framer-motion"],
  },
}));

import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_QUICKBOOKS_REDIRECT_URI": JSON.stringify(
      process.env.VITE_QUICKBOOKS_REDIRECT_URI
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so the built index.html + assets resolve correctly
  // whether served from a domain root, a subpath, or loaded directly
  // from an Android WebView (file:// or android_asset paths need
  // relative asset URLs, not an absolute "/kinonow_erp/" prefix).
  base: "./",
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? "/TalkBoard/" : "/",
  define: {
    process: JSON.stringify({
      env: {
        NODE_ENV: "development",
      },
    }),
  },
  server: {
    port: 3000,
    open: false,
  },
});

import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: { app: "index.html", about: "about.html", help: "help.html", privacy: "privacy.html" },
    },
  },
});

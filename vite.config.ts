import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import netlify from "@netlify/vite-plugin-tanstack-start"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  envDir: false,
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // The site ships no edge functions, and the Deno that Netlify's dev server
    // downloads (2.9+) rejects the --allow-scripts flag it passes.
    netlify({ dev: { edgeFunctions: { enabled: false } } }),
    viteReact(),
  ],
})

export default config

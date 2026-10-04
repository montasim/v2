import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import netlify from "@netlify/vite-plugin-tanstack-start"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  envDir: false,
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackStart(), netlify(), viteReact()],
})

export default config

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import type { LoadHook, ResolveHook } from "node:module"

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  if (!specifier.endsWith(".toon?raw")) {
    return nextResolve(specifier, context)
  }
  const resolved = await nextResolve(specifier.slice(0, -4), context)
  return { ...resolved, shortCircuit: true, url: `${resolved.url}?raw` }
}

export const load: LoadHook = async (url, context, nextLoad) => {
  if (!url.endsWith(".toon?raw")) return nextLoad(url, context)
  const contents = await readFile(fileURLToPath(url.slice(0, -4)), "utf8")
  return {
    format: "module",
    shortCircuit: true,
    source: `export default ${JSON.stringify(contents)}`,
  }
}

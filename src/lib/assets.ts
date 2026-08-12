export function optimizedImage(source: string) {
  return source.replace(/\.(?:png|jpe?g)$/i, ".webp")
}

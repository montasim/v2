const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const phonePattern = /(?<!\w)(?:\+?\d[\d ()-]{7,}\d)(?!\w)/g
const secretPattern = /\b(?:sk-|AIza|gsk_|or-v1-)[A-Za-z0-9_\-.]{12,}\b/g

export function redactChatText(value: string) {
  return value
    .replace(emailPattern, "[email redacted]")
    .replace(phonePattern, (candidate) =>
      candidate.replace(/\D/gu, "").length >= 10
        ? "[phone redacted]"
        : candidate
    )
    .replace(secretPattern, "[secret redacted]")
}

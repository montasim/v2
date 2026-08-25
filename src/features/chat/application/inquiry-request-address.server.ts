import { isIP } from "node:net"

export function resolveInquiryVisitorAddress(headers: Pick<Headers, "get">) {
  const directCandidates = [
    headers.get("x-nf-client-connection-ip"),
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
  ]

  for (const candidate of directCandidates) {
    const address = validIp(candidate)
    if (address) return address
  }

  const forwardedAddress = headers.get("x-forwarded-for")?.split(",")[0]
  return validIp(forwardedAddress) ?? "unknown-address"
}

function validIp(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized && isIP(normalized) !== 0 ? normalized : null
}

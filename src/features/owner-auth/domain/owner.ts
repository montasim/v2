const ownerAuthPaths = new Set([
  "callback/google",
  "get-session",
  "sign-in/social",
  "sign-out",
])

export function isPortfolioOwnerEmail(
  email: string | null | undefined,
  ownerEmail: string | null | undefined
) {
  const normalizedOwnerEmail = ownerEmail?.trim().toLocaleLowerCase()
  return (
    Boolean(normalizedOwnerEmail) &&
    email?.trim().toLocaleLowerCase() === normalizedOwnerEmail
  )
}

export function isOwnerAuthPath(path: string) {
  return ownerAuthPaths.has(path)
}

export function isGoogleAuthRequest(input: unknown) {
  return (
    typeof input === "object" &&
    input !== null &&
    "provider" in input &&
    input.provider === "google"
  )
}

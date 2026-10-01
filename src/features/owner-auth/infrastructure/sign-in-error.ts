export function getOwnerSignInError(error: unknown): string {
  if (error && typeof error === "object") {
    const code = "code" in error ? error.code : undefined
    const message = "message" in error ? error.message : undefined
    const status = "status" in error ? error.status : undefined

    if (
      (code === "DATABASE_ERROR" || code === "unexpected_failure") &&
      typeof message === "string" &&
      message.includes("exceeded the quota")
    ) {
      return "Sign-in is unavailable because the Neon account or project has exceeded its quota. Resolve the quota issue in Neon Console, then try again."
    }

    if (typeof status === "number" && status >= 500) {
      return "The authentication service could not start sign-in. Please try again later."
    }
  }

  return "Sign-in could not be started. Please try again."
}

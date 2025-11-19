"use client"

type OAuthMode = "login" | "signup"

const sanitizeRedirectPath = (path?: string) => {
  if (!path || !path.startsWith("/")) {
    return "/home"
  }
  return path
}

export const beginGoogleOAuth = (mode: OAuthMode = "login", redirectPath?: string) => {
  if (typeof window === "undefined") return

  const params = new URLSearchParams({
    mode,
    redirect: sanitizeRedirectPath(redirectPath || window.location.pathname),
  })

  window.location.href = `/auth/google?${params.toString()}`
}


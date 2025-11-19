"use client"

import { useEffect } from "react"

type SuccessPayload = {
  userName: string
  redirectPath: string | null
}

type UseGoogleAuthCompleteOptions = {
  onSuccess?: (payload: SuccessPayload) => void
  onError?: (message: string) => void
}

const sanitizeRedirectPath = (path: string | null) => {
  if (!path || !path.startsWith("/")) {
    return "/home"
  }
  return path
}

const cleanupAuthParams = (url: URL) => {
  ;["auth_success", "app_token", "user_name", "redirect_path", "auth_error"].forEach((param) => {
    url.searchParams.delete(param)
  })
  const newUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(null, "", newUrl)
}

export const useGoogleAuthComplete = ({
  onSuccess,
  onError,
}: UseGoogleAuthCompleteOptions = {}) => {
  useEffect(() => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    const error = url.searchParams.get("auth_error")

    if (error) {
      cleanupAuthParams(url)
      onError?.(decodeURIComponent(error))
      return
    }

    const success = url.searchParams.get("auth_success")
    const token = url.searchParams.get("app_token")
    const userName = url.searchParams.get("user_name")
    const redirectPath = sanitizeRedirectPath(url.searchParams.get("redirect_path"))

    if (success === "1" && token && userName) {
      localStorage.setItem("arcadeTrivia_token", token)
      localStorage.setItem("arcadeTrivia_user", userName)
      cleanupAuthParams(url)
      onSuccess?.({ userName, redirectPath })
    }
  }, [onSuccess, onError])
}


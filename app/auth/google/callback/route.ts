// app/auth/google/callback/route.ts
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type StatePayload = {
  mode: 'login' | 'signup'
  redirectPath: string
}

const decodeState = (state: string | null): StatePayload => {
  if (!state) {
    return { mode: 'login', redirectPath: '/home' }
  }

  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    const redirectPath =
      typeof parsed.redirectPath === 'string' ? parsed.redirectPath : '/home'
    const mode = parsed.mode === 'signup' ? 'signup' : 'login'
    return { mode, redirectPath }
  } catch {
    return { mode: 'login', redirectPath: '/home' }
  }
}

const sanitizeRedirectPath = (path?: string) => {
  if (!path || !path.startsWith('/')) {
    return '/home'
  }
  return path
}

const buildRedirect = (appUrl: string, redirectPath: string) => {
  return new URL(sanitizeRedirectPath(redirectPath), appUrl)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured on the server.' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = requestUrl
    const errorParam = searchParams.get('error')
    const code = searchParams.get('code')
    const rawState = searchParams.get('state')
    const { redirectPath } = decodeState(rawState)
    const redirectUrl = buildRedirect(appUrl, redirectPath)

    if (errorParam) {
      redirectUrl.searchParams.set('auth_error', errorParam)
      return NextResponse.redirect(redirectUrl)
    }

    if (!code) {
      redirectUrl.searchParams.set('auth_error', 'missing_code')
      return NextResponse.redirect(redirectUrl)
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${appUrl}/auth/google/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    if (!tokens.id_token) {
      redirectUrl.searchParams.set('auth_error', 'missing_id_token')
      return NextResponse.redirect(redirectUrl)
    }

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()
    const displayName =
      data.name ||
      data.email?.split('@')[0] ||
      'player'

    const backendResponse = await fetch(`${apiBaseUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: tokens.id_token }),
    })

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.json().catch(() => ({}))
      redirectUrl.searchParams.set('auth_error', errorBody.detail || 'google_auth_failed')
      return NextResponse.redirect(redirectUrl)
    }

    const appAuth = await backendResponse.json()

    if (!appAuth?.access_token) {
      redirectUrl.searchParams.set('auth_error', 'missing_app_token')
      return NextResponse.redirect(redirectUrl)
    }

    redirectUrl.searchParams.set('auth_success', '1')
    redirectUrl.searchParams.set('app_token', appAuth.access_token)
    redirectUrl.searchParams.set('user_name', displayName)
    redirectUrl.searchParams.set('redirect_path', redirectPath)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Google OAuth error:', error)
    const fallbackUrl = buildRedirect(appUrl, '/home')
    fallbackUrl.searchParams.set('auth_error', 'oauth_failed')
    return NextResponse.redirect(fallbackUrl)
  }
}
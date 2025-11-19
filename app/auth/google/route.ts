import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

const encodeState = (payload: Record<string, unknown>) => {
  try {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  } catch {
    return ''
  }
}

const sanitizeRedirectPath = (path: string | null) => {
  if (!path || !path.startsWith('/')) {
    return '/home'
  }
  return path
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const redirectPath = sanitizeRedirectPath(searchParams.get('redirect'))

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured on the server.' },
      { status: 500 }
    )
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/auth/google/callback`
  )

  const state = encodeState({ mode, redirectPath })

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    include_granted_scopes: true,
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
    ],
    state,
  })

  return NextResponse.redirect(authUrl)
}


import { google } from 'googleapis';

export const getGoogleAuthUrl = (mode: 'login' | 'signup' = 'login') => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'select_account',
    state: mode,
  });
};

export const getSession = async () => {
  const response = await fetch('/api/auth/session');
  return response.json();
};

export const signOut = async () => {
  // Clear the auth cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear any local storage
  localStorage.removeItem('arcadeTrivia_user');
  localStorage.removeItem('arcadeTrivia_token');
  // Redirect to home page
  window.location.href = '/';
};
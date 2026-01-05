// lib/googleCalendarClient.ts
import { google } from 'googleapis'
import { readTokens } from './googleTokenStore'

export async function getGoogleCalendarClient() {
  const tokens = await readTokens()
  const email = process.env.SMTP_USER!
  const stored = tokens[email]

  if (!stored || !stored.refreshToken) {
    throw new Error(`Aucun refreshToken trouvé pour ${email}`)
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({
    refresh_token: stored.refreshToken,
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  return calendar
}

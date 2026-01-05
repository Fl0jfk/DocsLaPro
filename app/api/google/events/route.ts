import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { readTokens } from '@/app/utils/googleTokenStore'

async function getGoogleCalendarClient() {
  const tokens = await readTokens()
  const email = process.env.GOOGLE_ACCOUNT_EMAIL!
  const stored = tokens[email]
  if (!stored || !stored.refreshToken) { throw new Error(`Aucun refreshToken trouvé pour ${email}`)}

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

function mapGoogleEventToUiEvent(googleEvent: any) {
  const start = googleEvent.start?.dateTime ?? googleEvent.start?.date
  const end = googleEvent.end?.dateTime ?? googleEvent.end?.date

  const creatorName =
    googleEvent.creator?.displayName ??
    googleEvent.creator?.email ??
    'Créé via GoogleAgenda'

  const colorId = googleEvent.colorId ?? null

  return {
    id: googleEvent.id,
    title: googleEvent.summary ?? '(Sans titre)',
    description: googleEvent.description ?? '',
    location: googleEvent.location ?? '',
    startDate: start,
    endDate: end,
    isAllDay: !googleEvent.start?.dateTime,
    colorId,
    google: {
      colorId,
      htmlLink: googleEvent.htmlLink ?? null,
      creatorName,
      attendees: (googleEvent.attendees ?? []).map((a: any) => ({
        email: a.email,
        displayName: a.displayName ?? null,
        responseStatus: a.responseStatus ?? null,
      })),
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const calendar = await getGoogleCalendarClient()
    const { searchParams } = new URL(req.url)

    const timeMin = searchParams.get('timeMin') ?? new Date().toISOString()
    const timeMax =
      searchParams.get('timeMax') ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const items = res.data.items ?? []
    const uiEvents = items.map(mapGoogleEventToUiEvent)

    return NextResponse.json(uiEvents)
  } catch (e) {
    console.error('Erreur GET /api/google/events', e)
    return NextResponse.json(
      { error: 'Failed to list events' },
      { status: 500 },
    )
  }
}

// ---------- POST : crée un event à partir de CreateEventPayload ----------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const calendar = await getGoogleCalendarClient()
    const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary'

    const {
      title,
      description,
      location,
      startDate,
      endDate,
      isAllDay,
      colorId,
    } = body as {
      title: string
      description: string
      location: string
      startDate: string
      endDate: string
      isAllDay: boolean
      colorId?: string | null
    }

    const event: any = {
      summary: title,
      description,
      location,
      start: {},
      end: {},
    }

    if (isAllDay) {
      event.start.date = startDate.slice(0, 10)
      event.end.date = endDate.slice(0, 10)
    } else {
      event.start.dateTime = startDate
      event.end.dateTime = endDate
    }

    if (colorId != null) {
      event.colorId = colorId
    }
    const resInsert = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })
    const created = mapGoogleEventToUiEvent(resInsert.data)
    return NextResponse.json(created)
  } catch (e: any) {
    console.error(
      'Erreur POST /api/google/events',
      JSON.stringify(e, null, 2),
    )
    return NextResponse.json(
      {
        error: 'Failed to create event',
        details: e?.message ?? null,
      },
      { status: 500 },
    )
  }
}

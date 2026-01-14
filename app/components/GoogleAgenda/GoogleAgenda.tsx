'use client'

import { useEffect, useState } from 'react'
import { startOfWeek, endOfWeek } from 'date-fns'
import PanelLeft from './Panel/PanelLeft'
import CreateEventModal, {
  CreateEventPayload,
} from '../Modal/CreateEventModal'
import Timeline from '../Timeline/Timeline'
import EventDetailModal from '../Modal/EventDetailModal'
import EditEventModal from '../Modal/EditEventModal'
import { CalendarViewTypes } from '../../utils/types'

export interface UiEvent {
  id: string
  title: string
  description: string
  location: string
  startDate: string
  endDate: string
  isAllDay: boolean
  colorId: string | null

  google?: {
    colorId: string | null
    htmlLink: string | null
    creatorName: string
    attendees: {
      email: string
      displayName: string | null
      responseStatus: string | null
    }[]
  }
}

export interface SelectedEventState {
  eventUid: string
  top: number
  left: number
  height: number
  width: number
}

export default function GoogleAgenda() {
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toString(),
  )
  const [calendarViewType] = useState(CalendarViewTypes.WEEK_VIEW)
  const [events, setEvents] = useState<UiEvent[]>([])
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SelectedEventState>({
    eventUid: '',
    top: 0,
    left: 0,
    height: 0,
    width: 0,
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<UiEvent | null>(null)
  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/google/status')
        const data = await res.json()
        setHasToken(data.hasToken)
      } catch (e) {
        console.error('Erreur /api/google/status', e)
        setHasToken(false)
      }
    }
    checkStatus()
  }, [])

  useEffect(() => {
    if (hasToken !== true) return
    const loadEvents = async () => {
      try {
        setLoadingEvents(true)
        const date = new Date(targetDate)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
        const timeMin = weekStart.toISOString()
        const timeMax = weekEnd.toISOString()
        const res = await fetch(`/api/google/events?timeMin=${encodeURIComponent( timeMin,)}&timeMax=${encodeURIComponent(timeMax)}`,
        )

        if (!res.ok) {
          console.error('Erreur fetch /api/google/events', await res.text())
          return
        }

        const data: UiEvent[] = await res.json()
        setEvents(data)
      } catch (e) {
        console.error('Erreur loadEvents', e)
      } finally {
        setLoadingEvents(false)
      }
    }

    loadEvents()
  }, [targetDate, hasToken])

  const handleOpenCreateModal = (basis?: {
    startDate: string
    endDate: string
  }) => {
    console.log(basis)
    setIsCreateEventModalOpen(true)
  }

  const handleSaveEvent = async (payload: CreateEventPayload) => {
    try {
      const res = await fetch('/api/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        console.error('Erreur POST /api/google/events', await res.text())
        return
      }

      const created: UiEvent = await res.json()
      setEvents(prev => [...prev, created])
    } catch (e) {
      console.error('Erreur handleSaveEvent', e)
    } finally {
      setIsCreateEventModalOpen(false)
    }
  }

  const handleCloseEventDetailModal = () => {
    setSelectedEvent(prev => ({
      ...prev,
      eventUid: '',
    }))
    setIsEditModalOpen(false)
  }

  function googleColorIdToClasses(colorId: string | null | undefined): string {
    switch (colorId) {
      case '1':  return 'bg-blue-500 text-white'
      case '2':  return 'bg-green-500 text-white'
      case '3':  return 'bg-purple-500 text-white'
      case '4':  return 'bg-red-500 text-white'
      case '5':  return 'bg-yellow-400 text-black'
      case '6':  return 'bg-orange-500 text-white'
      case '7':  return 'bg-teal-500 text-white'
      case '8':  return 'bg-gray-500 text-white'
      case '9':  return 'bg-indigo-500 text-white'
      case '10': return 'bg-lime-500 text-black'
      case '11': return 'bg-rose-500 text-white'
      default:   return 'bg-sky-500 text-white'
    }
  }

  const selectedEventData =
    selectedEvent.eventUid.length > 0
      ? events.find(e => e.id === selectedEvent.eventUid)
      : undefined

  const handleEditEvent = (ev: {
    id?: string
    title: string
    startDate: string
    endDate: string
    description: string
    colorId?: string | null
    location?: string
  }) => {
    if (!ev.id) return
    const uiEvent = events.find(e => e.id === ev.id)
    if (!uiEvent) return
    setEditingEvent(uiEvent)
    setIsEditModalOpen(true)
  }
  const handleEventUpdated = (updated: UiEvent) => {
    setEvents(prev =>
      prev.map(e => (e.id === updated.id ? updated : e)),
    )
  }
  if (hasToken === null) {
    return <p className="text-center py-10">Vérification de la connexion Google…</p>
  }

  if (hasToken === false) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="mb-4 text-center">
          Connecte ton compte Google pour afficher l’agenda et analyser les mails.
        </p>
        <a
          href="/api/google"
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Se connecter avec Google
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-[1500px] mx-auto hidden">
      <div className="flex gap-4">
        <PanelLeft
          targetDate={targetDate}
          setTargetDate={setTargetDate}
          onClickNewEvent={handleOpenCreateModal}
        />
        <div className="w-full flex flex-col">
          {loadingEvents && events.length === 0 ? (
            <p className="text-center py-10">Chargement des événements…</p>
          ) : (
            <Timeline
              calendarViewType={calendarViewType}
              targetDate={targetDate}
              events={events}
              onChangeTargetDate={setTargetDate}
              onSelectEvent={setSelectedEvent}
              onClickNewEvent={handleOpenCreateModal}
            />
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

      {selectedEventData && (
        <>
          <div className="absolute top-0 left-0 w-full h-full z-1" />
          <EventDetailModal
            selectedEvent={{
              ...selectedEvent,
              event: {
                id: selectedEventData.id,
                title: selectedEventData.title,
                startDate: selectedEventData.startDate,
                endDate: selectedEventData.endDate,
                colorClass: googleColorIdToClasses(selectedEventData.colorId),
                description: selectedEventData.description,
                colorId: selectedEventData.colorId ?? null,
                location: selectedEventData.location,
              },
              eventCreator: {
                displayName:
                  selectedEventData.google?.creatorName ?? 'Créé via GoogleAgenda',
              },
            }}
            onCloseModal={handleCloseEventDetailModal}
            onEditEvent={handleEditEvent}
          />
        </>
      )}

      {editingEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={editingEvent}
          onUpdated={handleEventUpdated}
        />
      )}
    </div>
  )
}

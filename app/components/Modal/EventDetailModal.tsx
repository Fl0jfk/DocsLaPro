'use client'

import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRef } from 'react'
import { MdClose, MdDelete, MdEdit, MdToday } from 'react-icons/md'
import IconButton from '../Common/Button/IconButton'

interface Event {
  id?: string              // pour Google eventId si dispo
  title: string
  startDate: string
  endDate: string
  colorClass?: string
  description: string
  colorId?: string | null
  location?:string  // optionnel: colorId Google
}

interface EventCreator {
  displayName: string
}

interface SelectedEvent {
  event: Event
  eventCreator: EventCreator
  top: number
  left: number
}

interface EventDetailModalProps {
  selectedEvent: SelectedEvent
  onCloseModal: () => void
  onEditEvent: (event: Event) => void
  onDeleteEvent?: (event: Event) => void
}

export default function EventDetailModal({
  selectedEvent,
  onCloseModal,
  onEditEvent,
  onDeleteEvent,
}: EventDetailModalProps) {
  const eventDetailModalRef = useRef<HTMLDivElement | null>(null)

  const parseEventDate = (startDate: string, endDate: string): string => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isSameDay(start, end)) {
      return `${format(start, 'EEEE d MMMM', { locale: fr })} · ${format(
        start,
        'HH:mm',
        { locale: fr },
      )} – ${format(end, 'HH:mm', { locale: fr })}`
    } else {
      return `${format(start, 'd MMM yyyy HH:mm', {
        locale: fr,
      })} – ${format(end, 'd MMM yyyy HH:mm', { locale: fr })}`
    }
  }

  const { event, eventCreator } = selectedEvent
  const colorClass = event.colorClass

  const handleEditClick = () => {
    onEditEvent(event)
  }

  const handleDeleteClick = () => {
    if (onDeleteEvent) {
      onDeleteEvent(event)
    }
  }

  return (
    <div
      ref={eventDetailModalRef}
      style={{
        top: selectedEvent.top,
        left: selectedEvent.left,
      }}
      className="absolute z-50 py-2 transition bg-white rounded-md min-w-448 eventDetailModalBoxShadow"
    >
      <div className="flex items-center justify-end px-1.5">
        <IconButton
          size="small"
          label="Modifier"
          tooltipLocation="top"
          imgComponent={<MdEdit size="20px" color="gray" />}
          onClickHandler={handleEditClick}
        />
        <IconButton
          size="small"
          label="Supprimer"
          tooltipLocation="top"
          imgComponent={<MdDelete size="20px" color="gray" />}
          onClickHandler={handleDeleteClick}
        />
        <IconButton
          size="small"
          label="Fermer"
          tooltipLocation="top"
          imgComponent={<MdClose size="20px" color="gray" />}
          onClickHandler={onCloseModal}
        />
      </div>

      <div>
        <div className="flex px-5">
          <div className="flex items-start justify-center">
            <div
              className={`mt-0.5 h-3.5 w-3.5 rounded-sm ${colorClass}`}
            />
          </div>
          <div className="flex flex-col items-start justify-start flex-auto pl-6">
            <span className="text-xl leading-none">
              {event.title}
            </span>
            <span className="pt-2 text-xs font-normal text-gray-500">
              {parseEventDate(event.startDate, event.endDate)}
            </span>
            {event.description && (
              <span className="pt-2 text-xs font-normal text-gray-700 whitespace-pre-wrap">
                {event.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex px-4 pb-2 mt-4">
          <div className="pl-0.5 flex items-center justify-center">
            <MdToday size="20px" color="gray" />
          </div>
          <div className="flex items-start justify-start flex-auto pl-5 text-xs text-gray-500">
            {eventCreator.displayName}
          </div>
        </div>
      </div>
    </div>
  )
}

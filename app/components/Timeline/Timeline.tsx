'use client'

import {
  eachDayOfInterval,
  format,
  set as setDate,
  setHours,
  setMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getDateRange,
  getClosestIndexForDayViewEvents,
} from '../../utils/helpers'
import {
  CalendarViewTypes,
  CalendarViewType,
} from '../../utils/types'
import { UiEvent, SelectedEventState } from '../GoogleAgenda/GoogleAgenda'


export interface TimelineBlockEvent {
  eventUid: string
  title: string
  startDate: string
  endDate: string
  colorId: string | null
  colIndex: number
  colCount: number
}

interface TimelineBlockProps {
  index: number
  event: TimelineBlockEvent
  onClickTimelineBlock: (payload: {
    eventUid: string
    top: number
    left: number
    height: number
    width: number
  }) => void
}

type DayEventsByHour = Record<
  number,
  Record<number, TimelineBlockEvent[]>
>

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

function TimelineBlock({
  index,
  event,
  onClickTimelineBlock,
}: TimelineBlockProps) {
  const timelineBlockRef = useRef<HTMLDivElement | null>(null)

  const getBlockHeight = (evt: TimelineBlockEvent): number => {
    const basePixel = 11
    const [startHour, startMinuteSeg] = getClosestIndexForDayViewEvents(
      new Date(evt.startDate),
    )
    const [endHour, endMinuteSeg] = getClosestIndexForDayViewEvents(
      new Date(evt.endDate),
    )

    if (startHour === endHour && startMinuteSeg === endMinuteSeg) {
      return 22
    }

    const start = setDate(new Date(evt.startDate), {
      hours: startHour,
      minutes: startMinuteSeg,
    })
    const end = setDate(new Date(evt.endDate), {
      hours: endHour,
      minutes: endMinuteSeg,
    })
    const diffSlots = Math.floor(differenceInMinutes(end, start) / 15)
    return diffSlots * basePixel + (diffSlots - 1)
  }

  const blockSubtitle = (blockHeight: number) => {
    if (blockHeight > 22) {
      const startTime = format(new Date(event.startDate), 'HH:mm', {
        locale: fr,
      })
      const endTime = format(new Date(event.endDate), 'HH:mm', {
        locale: fr,
      })
      return (
        <div className="pt-0.5">
          {`${startTime} - ${endTime}`}
        </div>
      )
    }
    return `, ${format(new Date(event.startDate), 'HH', {
      locale: fr,
    })}h`
  }

  const handleOnClickBlock = () => {
    if (!timelineBlockRef.current) return
    const { top, left, height, width } =
      timelineBlockRef.current.getBoundingClientRect()

    onClickTimelineBlock({
      eventUid: event.eventUid,
      top: top - 65,
      left: left - 248,
      height,
      width,
    })
  }

  const heightPx = getBlockHeight(event)

  const widthPercent = 100 / event.colCount
  const leftPercent = widthPercent * event.colIndex

  const dStart = new Date(event.startDate)
  const minutes = dStart.getMinutes()
  const slotPx = 11
  const offsetSlots = minutes / 15
  const topPx = offsetSlots * slotPx

  const colorClass = googleColorIdToClasses(event.colorId)

  return (
    <div
      ref={timelineBlockRef}
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        height: `${heightPx}px`,
        width: `${widthPercent}%`,
        left: `${leftPercent}%`,
        zIndex: 30 + index,
      }}
      className={`rounded-md overflow-x-hidden px-2.5 pt-0.5 cursor-pointer text-xs ${colorClass}`}
      onClick={handleOnClickBlock}
    >
      <div className="min-w-0 font-normal truncate">
        {event.title}
        {blockSubtitle(heightPx)}
      </div>
    </div>
  )
}

/* ---------- Algo colonne “façon Google” ---------- */

function overlap(a: UiEvent, b: UiEvent): boolean {
  const aStart = new Date(a.startDate)
  const aEnd = new Date(a.endDate)
  const bStart = new Date(b.startDate)
  const bEnd = new Date(b.endDate)

  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd)
}

function getMaxOverlap(group: UiEvent[]): number {
  const points: { time: Date; type: 'start' | 'end' }[] = []
  group.forEach(e => {
    points.push({ time: new Date(e.startDate), type: 'start' })
    points.push({ time: new Date(e.endDate), type: 'end' })
  })
  points.sort((a, b) => a.time.getTime() - b.time.getTime())

  let cur = 0
  let max = 0
  points.forEach(p => {
    if (p.type === 'start') {
      cur += 1
      if (cur > max) max = cur
    } else {
      cur -= 1
    }
  })
  return Math.max(max, 1)
}

function layoutDayEvents(events: UiEvent[]): DayEventsByHour {
  const normalEvents = events.filter(e => !e.isAllDay)

  const sorted = normalEvents.slice().sort((a, b) =>
    isBefore(new Date(a.startDate), new Date(b.startDate)) ? -1 : 1,
  )

  type LaidOutEvent = TimelineBlockEvent
  const laidOut: LaidOutEvent[] = []

  let group: UiEvent[] = []

  const flushGroup = () => {
    if (group.length === 0) return

    const maxCols = getMaxOverlap(group)

    const cols: UiEvent[][] = []
    group.forEach(ev => {
      let placed = false
      for (let c = 0; c < cols.length; c++) {
        const last = cols[c][cols[c].length - 1]
        if (!overlap(last, ev)) {
          cols[c].push(ev)
          placed = true
          break
        }
      }
      if (!placed) cols.push([ev])
    })

    group.forEach(ev => {
      const start = new Date(ev.startDate)
      const firstStart = new Date(group[0].startDate)

      const evOverlapsFirst =
        overlap(ev, group[0]) && start.getTime() > firstStart.getTime()

      let colIndex = 0
      let colCount = 1

      if (ev === group[0] && !evOverlapsFirst) {
        colIndex = 0
        colCount = 1
      } else {
        for (let c = 0; c < cols.length; c++) {
          if (cols[c].includes(ev)) {
            colIndex = c
            break
          }
        }
        colCount = maxCols
      }

      laidOut.push({
        eventUid: ev.id,
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        colorId: ev.colorId ?? null,
        colIndex,
        colCount,
      })
    })

    group = []
  }

  sorted.forEach(ev => {
    if (group.length === 0) {
      group.push(ev)
      return
    }

    const lastInGroup = group[group.length - 1]
    const lastEnd = new Date(lastInGroup.endDate)
    const curStart = new Date(ev.startDate)

    if (isAfter(curStart, lastEnd)) {
      flushGroup()
      group.push(ev)
    } else {
      group.push(ev)
    }
  })
  flushGroup()

  const byHour: DayEventsByHour = {}
  laidOut.forEach(e => {
    const d = new Date(e.startDate)
    const hour = d.getHours()
    const minutes = d.getMinutes()

    const minuteKey =
      minutes < 15 ? 0 :
      minutes < 30 ? 15 :
      minutes < 45 ? 30 : 45

    if (!byHour[hour]) byHour[hour] = {}
    if (!byHour[hour][minuteKey]) byHour[hour][minuteKey] = []
    byHour[hour][minuteKey].push(e)
  })

  return byHour
}

/* ---------- Composant principal semaine ---------- */

interface TimelineFullProps {
  calendarViewType: CalendarViewType
  targetDate: string
  events: UiEvent[]
  onChangeTargetDate: Dispatch<SetStateAction<string>>
  onSelectEvent: Dispatch<SetStateAction<SelectedEventState>>
  onClickNewEvent: (basis?: { startDate: string; endDate: string }) => void
}

export default function TimelineFull({
  calendarViewType,
  targetDate,
  events,
  onSelectEvent,
}: TimelineFullProps) {
  const timelineHeaderRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [targetDateRange, setTargetDateRange] = useState<Date[]>([])
  const [timelineMaxHeight, setTimelineMaxHeight] = useState(
    'calc(100vh - (65px + 43px))',
  )
  const [weekEventsByDay, setWeekEventsByDay] = useState<
    Record<number, DayEventsByHour>
  >({})

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onClickTimelineBlock = (payload: any) => {
    onSelectEvent(payload)
  }

  const START_HOUR = 6
  const END_HOUR = 19

  useEffect(() => {
    const getDayList = (
      target: string,
      viewType: CalendarViewType,
    ): Date[] => {
      switch (viewType) {
        case CalendarViewTypes.WEEK_VIEW: {
          const [start, end] = getDateRange(viewType, target)
          return eachDayOfInterval({ start, end })
        }
        default:
          return []
      }
    }

    if (targetDate) {
      setTargetDateRange(getDayList(targetDate, calendarViewType))
    }
  }, [targetDate, calendarViewType])

  useEffect(() => {
    if (calendarViewType !== CalendarViewTypes.WEEK_VIEW) return
    if (!targetDate) return
    if (targetDateRange.length === 0) return

    const [rangeStart, rangeEnd] = getDateRange(
      CalendarViewTypes.WEEK_VIEW,
      targetDate,
    )

    const result: Record<number, DayEventsByHour> = {}

    targetDateRange.forEach((colDate, dayIndex) => {
      const dayStart = new Date(
        colDate.getFullYear(),
        colDate.getMonth(),
        colDate.getDate(),
        0,
        0,
        0,
        0,
      )
      const dayEnd = new Date(
        colDate.getFullYear(),
        colDate.getMonth(),
        colDate.getDate(),
        23,
        59,
        59,
        999,
      )

      const eventsForDay = events.filter(e => {
        const start = new Date(e.startDate)

        if (start < rangeStart || start > rangeEnd) return false

        return start >= dayStart && start <= dayEnd
      })

      result[dayIndex] = layoutDayEvents(eventsForDay)
    })

    setWeekEventsByDay(result)
  }, [events, targetDate, calendarViewType, targetDateRange])

  useEffect(() => {
    if (!timelineHeaderRef.current) return
    const height =
      timelineHeaderRef.current.getBoundingClientRect().height
    setTimelineMaxHeight(`calc(100vh - (65px + ${height}px))`)
  }, [targetDate, weekEventsByDay])

  return (
    <div className="flex flex-col w-full">
      {/* Header jours */}
      <div ref={timelineHeaderRef} className="flex flex-col">
        <div className="flex justify-between w-full pl-14">
          {targetDateRange.map((date, i) => (
            <div
              key={i}
              className={`
                flex flex-col items-center justify-start
                ${targetDateRange.length > 1 ? 'flex-1' : ''}
                ${targetDateRange.length === 1 ? 'pl-3' : ''}
              `}
            >
              <span className="flex items-center justify-center h-8 mt-2 font-medium text-gray-600">
                {format(new Date(date), 'EEE', { locale: fr }).toUpperCase()}
              </span>
              <span className="flex items-center justify-center text-2xl transition text-gray-700 w-10 h-10">
                {format(new Date(date), 'd', { locale: fr })}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full border-b border-l" />
      </div>

      {/* Grille */}
      <div
        ref={timelineRef}
        style={{ maxHeight: timelineMaxHeight }}
        className="flex flex-auto overflow-y-auto"
      >
        {/* colonne heures */}
        <div>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, idx) => {
            const hour = START_HOUR + idx
            const date = setMinutes(setHours(new Date(), hour), 0)
            return (
              <div
                key={hour}
                className="flex h-12 text-gray-500"
              >
                <span className="text-right pt-3">
                  {format(date, 'HH:mm', { locale: fr })}
                </span>
                <div className="w-2 h-12" />
              </div>
            )
          })}
        </div>

        {/* colonnes jours */}
        <div className="flex flex-auto border-l divide-x">
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const byHour = weekEventsByDay[dayIndex] || {}
            return (
              <div
                key={dayIndex}
                className="flex-1"
              >
                {Array.from({
                  length: END_HOUR - START_HOUR + 1,
                }).map((_, idx) => {
                  const hour = START_HOUR + idx
                  const segments = byHour[hour] || {}
                  return (
                    <div
                      key={hour}
                      className="relative w-full h-12 border-b"
                    >
                      {Object.keys(segments).map(segKey => {
                        const segEvents = segments[Number(segKey)] || []
                        return segEvents.map((e, idx2) => (
                          <TimelineBlock
                            key={`${hour}-${segKey}-${idx2}`}
                            index={idx2}
                            event={e}
                            onClickTimelineBlock={onClickTimelineBlock}
                          />
                        ))
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

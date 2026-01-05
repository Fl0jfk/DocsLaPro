import {
  closestTo,
  eachHourOfInterval,
  endOfDay,
  endOfWeek,
  getHours,
  getMinutes,
  set as setDate,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import {
  CalendarViewTypes,
  CalendarViewType,
  EventRepeatTypes,
  EventRepeatType,
  MINUTE_SEGMENT_INDEX,
  MINUTE_SEGMENT_KEYS,
  MinuteSegmentKey,
  MinuteIndex,

} from './types'

export const repeatTypeStringLookup: Record<EventRepeatType | -1, string> = {
  [-1]: 'Ne pas répéter',
  [EventRepeatTypes.DAILY]: 'Journalier',
  [EventRepeatTypes.WEEKLY]: 'Hebdomadaire',
  [EventRepeatTypes.MONTHLY]: 'Mensuel',
}

export const isValidTime = (strValue: string): [boolean, number, number] => {
  const trimmed = strValue.trim()
  const split = trimmed.split(':')

  if (split.length !== 2) return [false, 0, 0]

  const hour = Number(split[0])
  const minutes = Number(split[1])

  if (isNaN(hour) || isNaN(minutes)) return [false, 0, 0]
  if (hour < 0 || hour > 23) return [false, 0, 0]
  if (minutes < 0 || minutes > 59) return [false, 0, 0]

  return [true, hour, minutes]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sortEventBlocks = <T extends Record<string, any>>(
  events: T[],
  key: keyof T,
  isAscending = true,
): T[] => {
  const compFunc = (a: number | Date, b: number | Date, asc: boolean) =>
    asc ? (a < b ? -1 : a > b ? 1 : 0) : (a < b ? 1 : a > b ? -1 : 0)

  return events
    .slice()
    .sort((a, b) => {
      if (key === 'startDate' || key === 'endDate' || key === 'createdAt') {
        return compFunc(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date(a[key] as any),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date(b[key] as any),
          isAscending,
        )
      }

      if (a[key] === b[key]) {
        return compFunc(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date(a['startDate'] as any),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date(b['startDate'] as any),
          isAscending,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return compFunc(a[key] as any, b[key] as any, isAscending)
    })
}

export interface DayViewHourSegment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[]
  startColIndex: number
  colCount: number
  baseZIndex: number
}

export type DayViewHours = Record<
  number,
  Record<MinuteSegmentKey, DayViewHourSegment>
>

export const getBaseDayViewEvents = () => {
  const hours: DayViewHours = Array(24)
    .fill(null)
    .map((_, i) => i)
    .reduce<DayViewHours>((acc, cur) => {
      const segment: Record<MinuteSegmentKey, DayViewHourSegment> = {
        0: {
          events: [],
          startColIndex: 0,
          colCount: 1,
          baseZIndex: 1,
        },
        15: {
          events: [],
          startColIndex: 0,
          colCount: 1,
          baseZIndex: 1,
        },
        30: {
          events: [],
          startColIndex: 0,
          colCount: 1,
          baseZIndex: 1,
        },
        45: {
          events: [],
          startColIndex: 0,
          colCount: 1,
          baseZIndex: 1,
        },
      }
      acc[cur] = segment
      return acc
    }, {} as DayViewHours)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wholeDayEvents: [] as any[],
    hours,
  }
}

export interface WeekDayEvents {
  hours: DayViewHours
}

export const getBaseWeekViewEvents = () => {
  const weekArray = Array(7)
    .fill(null)
    .map((_, i) => i)

  const days = weekArray.reduce<Record<number, DayViewHours>>((acc, cur) => {
    const { hours } = getBaseDayViewEvents()
    acc[cur] = { ...hours }
    return acc
  }, {})

  const wholeDayEvents = weekArray.reduce<
    Record<
      number,
      {
        incomingRowsMatrix: Record<number, number>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: any[]
      }
    >
  >((acc, cur) => {
    acc[cur] = {
      incomingRowsMatrix: {},
      events: [],
    }
    return acc
  }, {})

  return {
    wholeDayEvents,
    days,
  }
}

export const getUpdatedEventBlocksWithPlacement = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[],
  incomingRowsMatrix: Record<number, number>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = []
  let eventIndex = 0
  let matrixIndex = 0

  while (eventIndex < events.length) {
    if (matrixIndex in incomingRowsMatrix) {
      list.push({ isEmpty: true })
    } else {
      list.push({
        ...events[eventIndex],
        isEmpty: false,
      })
      eventIndex++
    }
    matrixIndex++
  }

  return list
}

export const calculateIncomingRowMatrix = (
  eventsByDay: Record<
    number,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: any[]
      incomingRowsMatrix: Record<number, number>
    }
  >,
  isWeek = false,
) => {
  const container: typeof eventsByDay = { ...eventsByDay }
  let baseIncomingRowsMatrix: Record<number, number> = {}
  let count = 0
  let rowIndex = 0
  let keys = Object.keys(container).map(Number)
  if (isWeek) {
    const updated = keys.slice()
    const temp = updated.shift()
    if (temp !== undefined) updated.push(temp)
    keys = updated
  }

  keys.forEach(day => {
    if (count === 7) {
      count = 0
      baseIncomingRowsMatrix = {}
    }

    container[day] = {
      ...container[day],
      events: sortEventBlocks(container[day].events, 'duration', false),
    }
    const deletedKeys: number[] = []
    Object.keys(baseIncomingRowsMatrix).forEach(v => {
      const keyNum = Number(v)
      if (baseIncomingRowsMatrix[keyNum] === 0) {
        deletedKeys.push(keyNum)
        delete baseIncomingRowsMatrix[keyNum]
      }
    })

    if (deletedKeys.length > 0) {
      rowIndex = Math.min(...deletedKeys)
    }

    container[day] = {
      ...container[day],
      incomingRowsMatrix: { ...baseIncomingRowsMatrix },
    }

    Object.keys(baseIncomingRowsMatrix).forEach(v => {
      const keyNum = Number(v)
      baseIncomingRowsMatrix[keyNum] = baseIncomingRowsMatrix[keyNum] - 1
    })

    container[day].events.forEach(e => {
      if (e.duration > 0) {
        baseIncomingRowsMatrix[rowIndex] = e.duration
        rowIndex += 1
        while (rowIndex in baseIncomingRowsMatrix) {
          rowIndex += 1
        }
      }
    })

    count += 1
  })

  return container
}

export const getDateRange = (
  calendarViewType: CalendarViewType,
  targetDate: string | Date,
): [Date, Date] => {
  const target = new Date(targetDate)

  switch (calendarViewType) {
    case CalendarViewTypes.WEEK_VIEW: {
      const weekStart = startOfWeek(target, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(target, { weekStartsOn: 1 })
      return [weekStart, endOfDay(weekEnd)]
    }
    default:
      return [startOfDay(target), endOfDay(target)]
  }
}

export const getClosestIndexForDayViewEvents = (
  date: Date,
): [number, MinuteSegmentKey] => {
  const ZERO = setDate(date, { minutes: 0 })
  const FIFTEEN = setDate(date, { minutes: 15 })
  const THIRTY = setDate(date, { minutes: 30 })
  const FOURTYFIVE = setDate(date, { minutes: 45 })

  const closest = closestTo(date, [ZERO, FIFTEEN, THIRTY, FOURTYFIVE])
  if (!closest) {
    return [getHours(date), 0]
  }
  const m = getMinutes(closest) as 0 | 15 | 30 | 45
  const minuteKey = ((): MinuteSegmentKey => {
    switch (m) {
      case 0:
        return 0
      case 15:
        return 15
      case 30:
        return 30
      case 45:
        return 45
      default:
        return 0
    }
  })()

  return [getHours(date), minuteKey]
}

export const findEventCoverage = (event: {
  startDate: string
  endDate: string
}) => {
  const coveredHours = eachHourOfInterval({
    start: new Date(event.startDate),
    end: new Date(event.endDate),
  })

  const startDateMinuteKey = getClosestIndexForDayViewEvents(
    new Date(event.startDate),
  )[1]
  const endDateMinuteKey = getClosestIndexForDayViewEvents(
    new Date(event.endDate),
  )[1]

  if (coveredHours.length === 1) {
    const startSeg = MINUTE_SEGMENT_INDEX[startDateMinuteKey]
    const endSegRaw = MINUTE_SEGMENT_INDEX[endDateMinuteKey]
    const endSeg =
      startSeg === endSegRaw ? ((endSegRaw as MinuteIndex) + 1) : endSegRaw

    return {
      [coveredHours[0].toString()]: MINUTE_SEGMENT_KEYS.slice(
        startSeg,
        endSeg,
      ) as MinuteSegmentKey[],
    } as Record<string, MinuteSegmentKey[]>
  }

  // > 1h
  const result = coveredHours
    .map((hour, index) => {
      if (index === 0) {
        return {
          hour: hour.toString(),
          minuteSegments: MINUTE_SEGMENT_KEYS.slice(
            MINUTE_SEGMENT_INDEX[startDateMinuteKey],
          ) as MinuteSegmentKey[],
        }
      }

      if (index === coveredHours.length - 1) {
        const endSegRaw = MINUTE_SEGMENT_INDEX[endDateMinuteKey]
        const endSeg =
          endSegRaw === 0 ? ((endSegRaw as MinuteIndex) + 1) : endSegRaw

        return {
          hour: hour.toString(),
          minuteSegments: MINUTE_SEGMENT_KEYS.slice(
            0,
            endSeg,
          ) as MinuteSegmentKey[],
        }
      }

      return {
        hour: hour.toString(),
        minuteSegments: [...MINUTE_SEGMENT_KEYS] as MinuteSegmentKey[],
      }
    })
    .reduce<Record<string, MinuteSegmentKey[]>>((acc, cur) => {
      acc[cur.hour] = cur.minuteSegments
      return acc
    }, {})

  return result
}

export const reduceCoverages = (
  coveragesArray: Record<string, MinuteSegmentKey[]>[],
) => {
  const reducedCoverage: Record<number, Record<MinuteSegmentKey, number>> = {}

  coveragesArray.forEach(coverage => {
    const hourKeys = Object.keys(coverage)

    for (let i = 0; i < hourKeys.length; i++) {
      const hourNum = getHours(new Date(hourKeys[i]))

      if (!(hourNum in reducedCoverage)) {
        reducedCoverage[hourNum] = {
          0: 0,
          15: 0,
          30: 0,
          45: 0,
        }
      }

      const minuteSegments = coverage[hourKeys[i]] as MinuteSegmentKey[]

      minuteSegments.forEach(segmentKey => {
        reducedCoverage[hourNum][segmentKey] =
          reducedCoverage[hourNum][segmentKey] + 1
      })
    }
  })

  return reducedCoverage
}

export const calculateOverlap = (
  reduceCoverage: Record<number, Record<MinuteSegmentKey, number>>,
  hoursObject: DayViewHours,
) => {
  const coverageHours = Object.keys(reduceCoverage).map(Number)

  coverageHours.forEach(hour => {
    const coverageMinuteSegments =
      Object.keys(reduceCoverage[hour]) as unknown as MinuteSegmentKey[]

    coverageMinuteSegments.forEach(minute => {
      const coverageCount = reduceCoverage[hour][minute]
      const { events } = hoursObject[hour][minute]

      if (events.length < coverageCount) {
        const diff = coverageCount - events.length
        hoursObject[hour][minute].colCount = diff + 1
        hoursObject[hour][minute].startColIndex = diff
        hoursObject[hour][minute].baseZIndex = diff
      }
    })
  })
}

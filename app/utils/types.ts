export const EventRepeatTypes = { DAILY: 0, WEEKLY: 1, MONTHLY: 2,} as const

export type EventRepeatType =
  (typeof EventRepeatTypes)[keyof typeof EventRepeatTypes]

export const EventInviteStatusTypes = {
  PENDING: 0,
  ACCEPTED: 1,
  DECLINED: 2,
} as const

export type EventInviteStatusType =
  (typeof EventInviteStatusTypes)[keyof typeof EventInviteStatusTypes]

export const CalendarViewTypes = {
  WEEK_VIEW: 1,
} as const

export type CalendarViewType =
  (typeof CalendarViewTypes)[keyof typeof CalendarViewTypes]

export const RepeatChangesTypes = {
  CHANGE: 'change',
  DELETE: 'delete',
} as const

export type RepeatChangesType =
  (typeof RepeatChangesTypes)[keyof typeof RepeatChangesTypes]

export const MINUTE_SEGMENT_INDEX = {
  0: 0,
  15: 1,
  30: 2,
  45: 3,
} as const

// "0" | "15" | "30" | "45"
export type MinuteSegmentKey = keyof typeof MINUTE_SEGMENT_INDEX

// 0 | 1 | 2 | 3
export type MinuteIndex = (typeof MINUTE_SEGMENT_INDEX)[MinuteSegmentKey]

// On cast d'abord vers unknown, puis vers MinuteSegmentKey[]
export const MINUTE_SEGMENT_KEYS =
  Object.keys(MINUTE_SEGMENT_INDEX) as unknown as MinuteSegmentKey[]


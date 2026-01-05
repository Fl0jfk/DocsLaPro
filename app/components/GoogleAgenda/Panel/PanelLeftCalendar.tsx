'use client'

import Calendar from '../../Common/Calendar/Calendar'

interface PanelLeftCalendarProps {
  targetDate: string
  setTargetDate: (value: string) => void
}

export default function PanelLeftCalendar({
  targetDate,
  setTargetDate,
}: PanelLeftCalendarProps) {
  const onClickDate = (date: Date) => {
    setTargetDate(date.toString())
  }

  return (
    <Calendar
      targetDate={targetDate}
      onClickDate={onClickDate}
    />
  )
}

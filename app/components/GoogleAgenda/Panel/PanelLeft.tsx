'use client'

import { getHours, getMinutes, set } from 'date-fns'
import Image from 'next/image'
import PanelLeftCalendar from './PanelLeftCalendar'

interface PanelLeftProps {
  targetDate: string
  setTargetDate: (value: string) => void
  onClickNewEvent: (basis?: { startDate: string; endDate: string }) => void
}

export default function PanelLeft({
  targetDate,
  setTargetDate,
  onClickNewEvent,
}: PanelLeftProps) {
  const onClickCreate = () => {
    const now = new Date()
    const newEventBaseDate = set(new Date(targetDate), {
      hours: getHours(now),
      minutes: getMinutes(now),
    }).toString()

    onClickNewEvent({
      startDate: newEventBaseDate,
      endDate: newEventBaseDate,
    })
  }

  return (
    <div>
      <div className="pl-2 my-4">
        <button
          className="flex items-center justify-center h-12 p-3.5 text-sm transition bg-white border rounded-full shadow-md border-opacity-30 min-w-56 hover:shadow-xl hover:bg-blue-50"
          onClick={onClickCreate}
        >
          <Image
            src="/createIcon.png"
            height={32}
            width={32}
            alt="create-icon"
          />
          <span className="pr-3 ml-3 font-normal tracking-wide text-gray-500">
            Créer
          </span>
        </button>
      </div>
      <PanelLeftCalendar targetDate={targetDate} setTargetDate={setTargetDate} />
    </div>
  )
}

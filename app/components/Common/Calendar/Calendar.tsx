'use client'

import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getMonth,
  getYear,
  isSameDay,
  isSameWeek,
  setMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import IconButton from '../Button/IconButton'

interface CalendarProps {
  targetDate: string | Date
  onClickDate: (date: Date) => void
  isModal?: boolean
  onClose?: () => void
}

export default function Calendar({
  targetDate,
  onClickDate,
  isModal = false,
  onClose = () => {},
}: CalendarProps) {
  const today = new Date()
  const calendarRef = useRef<HTMLDivElement | null>(null)
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())

  useEffect(() => {
    const target = new Date(targetDate)
    const diffMonths =
      getMonth(target) - getMonth(calendarDate) +
      12 * (target.getFullYear() - calendarDate.getFullYear())
    if (diffMonths !== 0) {
      setCalendarDate(current =>
        diffMonths > 0
          ? addMonths(current, diffMonths)
          : subMonths(current, Math.abs(diffMonths)),
      )
    }
  }, [targetDate])

  useEffect(() => {
    if (!isModal) return
    const checkOutsideClick = (e: MouseEvent) => {
      if (calendarRef.current) {
        const outsideClick = !calendarRef.current.contains(e.target as Node)
        if (outsideClick) {
          onClose()
        }
      }
    }
    document.addEventListener('click', checkOutsideClick)
    return () => {
      document.removeEventListener('click', checkOutsideClick)
    }
  }, [isModal, onClose])

  const onClickMoveMonth = (dir: 'prev' | 'next') => {
    const newDate = new Date(calendarDate)
    if (dir === 'prev') {
      setCalendarDate(subMonths(newDate, 1))
    } else {
      setCalendarDate(addMonths(newDate, 1))
    }
  }

  const isEqualDate = (a: Date | string, b: Date | string): boolean => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return isSameDay(dateA, dateB)
  }

  const gridHeader = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
    <div
      key={i}
      className="flex items-center justify-center h-6 text-gray-500 bg-white"
    >
      {d}
    </div>
  ))

  const gridDates = (startDate: Date | string = Date()) => {
    const target = new Date(startDate)
    const targetMonth = getMonth(target)
    const targetYear = getYear(target)

    const month = setMonth(
      new Date(targetYear, 0, 1),
      targetMonth,
    )

    const monthRangeStart = startOfWeek(startOfMonth(month), {
      weekStartsOn: 1,
    })
    const monthRangeEndRaw = endOfWeek(endOfMonth(month), {
      weekStartsOn: 1,
    })

    // on génère les jours pour couvrir le mois (classique)
    const allDays = eachDayOfInterval({
      start: monthRangeStart,
      end: monthRangeEndRaw,
    })

    // on regroupe par semaines (7 jours)
    const weeks: Date[][] = []
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }

    // filtrage pour supprimer une éventuelle 7e ligne complètement "mois suivant"
    const filteredWeeks = weeks.filter((week, index) => {
      const hasCurrentMonthDay = week.some(
        d => getMonth(d) === targetMonth && getYear(d) === targetYear,
      )
      if (hasCurrentMonthDay) return true

      // garder la semaine qui contient la targetDate (si tu veux voir une semaine entamée)
      const hasTargetWeek = week.some(d =>
        isSameWeek(d, target, { weekStartsOn: 1 }),
      )
      return hasTargetWeek
    })

    const flatDays = filteredWeeks.flat()

    const dynamicDateColor = (
      today: Date,
      date: Date,
      targetDate: Date | string,
      curDateMonth: number,
      targetMonth: number,
    ): string => {
      const base ='flex items-center justify-center w-6 h-6 transition rounded-full'
      if (
        (isEqualDate(today, date) && isEqualDate(targetDate, date)) ||
        isEqualDate(today, date)
      ) {
        // aujourd'hui (et sélectionné)
        return base + 'bg-blue-500 hover:bg-blue-600 text-white '
      }
      if (isEqualDate(targetDate, date)) {
        // date sélectionnée
        return base + 'bg-blue-300 text-blue-800 hover:bg-blue-400'
      }
      if (curDateMonth !== targetMonth) {
        // jours du mois précédent / suivant
        return base + 'text-gray-400 hover:bg-gray-100'
      }
      // jours normaux du mois courant
      return base + 'text-gray-900 hover:bg-gray-200'
    }

    const days = flatDays.map((date, i) => {
      const curDateMonth = getMonth(date)
      return (
        <div
          key={i}
          className="flex items-center justify-center bg-white cursor-pointer"
          onClick={() => onClickDate(date)}
        >
          <p
            className={dynamicDateColor(
              today,
              date,
              targetDate,
              curDateMonth,
              targetMonth,
            )}
          >
            {getDate(date)}
          </p>
        </div>
      )
    })

    return days
  }

  return (
    <div
      ref={calendarRef}
      className="px-4 pt-2 pb-6 bg-white"
    >
      <div className="flex items-center justify-between pl-2.5 pr-1">
        <p>
          {format(new Date(calendarDate), 'MMMM yyyy', {
            locale: fr,
          })}
        </p>
        <div className="flex">
          <IconButton
            size="xs"
            label="Previous Month"
            tooltipLocation="bottom"
            imgComponent={
              <MdKeyboardArrowLeft
                size="20px"
                color="rgba(95, 105, 119)"
              />
            }
            onClickHandler={() => onClickMoveMonth('prev')}
          />
          <IconButton
            size="xs"
            label="Next Month"
            tooltipLocation="bottom"
            imgComponent={
              <MdKeyboardArrowRight
                size="20px"
                color="rgba(80, 80, 60)"
              />
            }
            onClickHandler={() => onClickMoveMonth('next')}
          />
        </div>
      </div>
      <div className="grid grid-cols-7 mt-2 gap-y-1">
        {gridHeader}
        {gridDates(calendarDate)}
      </div>
    </div>
  )
}

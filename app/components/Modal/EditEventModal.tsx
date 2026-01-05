'use client'

import {
  endOfDay,
  format,
  getDate,
  getHours,
  getMinutes,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  set as setDate,
  startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import {
  MdAccessTime,
  MdArrowDropDown,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdClose,
  MdColorLens,
  MdLocationOn,
  MdSubject,
} from 'react-icons/md'
import { isValidTime, repeatTypeStringLookup } from '../../utils/helpers'
import {
  EventRepeatTypes,
  EventRepeatType,
} from '../../utils/types'
import IconButton from '../Common/Button/IconButton'
import Calendar from '../Common/Calendar/Calendar'
import Dropdown from '../Common/Dropdown/Dropdown'
import type { UiEvent } from '../GoogleAgenda/GoogleAgenda'

// mêmes couleurs Google que pour la création
const GOOGLE_COLORS: { id: string; label: string; className: string }[] = [
  { id: '1',  label: 'Bleu',        className: 'bg-blue-500 text-white' },
  { id: '2',  label: 'Vert clair',  className: 'bg-emerald-400 text-white' },
  { id: '3',  label: 'Violet',      className: 'bg-purple-500 text-white' },
  { id: '4',  label: 'Rouge',       className: 'bg-red-500 text-white' },
  { id: '5',  label: 'Jaune',       className: 'bg-yellow-400 text-black' },
  { id: '6',  label: 'Orange',      className: 'bg-orange-500 text-white' },
  { id: '7',  label: 'Turquoise',   className: 'bg-teal-500 text-white' },
  { id: '8',  label: 'Gris',        className: 'bg-gray-500 text-white' },
  { id: '9',  label: 'Indigo',      className: 'bg-indigo-500 text-white' },
  { id: '10', label: 'Vert',        className: 'bg-lime-500 text-black' },
  { id: '11', label: 'Rose',        className: 'bg-rose-500 text-white' },
]

function getColorClass(colorId: string | null | undefined): string {
  const found = GOOGLE_COLORS.find(c => c.id === colorId)
  return found?.className ?? 'bg-sky-500 text-white'
}

interface EditEventModalProps {
  isOpen: boolean
  onClose: () => void
  event: UiEvent | null
  onUpdated: (updated: UiEvent) => void
}

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onUpdated,
}: EditEventModalProps) {
  const startDateInputRef = useRef<HTMLInputElement | null>(null)
  const endDateInputRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const [startDate, setStartDate] = useState<string>(new Date().toISOString())
  const [startDateInputValue, setStartDateInputValue] = useState('')
  const [showStartDateInput, setShowStartDateInput] = useState(false)

  const [endDate, setEndDate] = useState<string>(new Date().toISOString())
  const [endDateInputValue, setEndDateInputValue] = useState('')
  const [showEndDateInput, setShowEndDateInput] = useState(false)

  const [isAllDay, setIsAllDay] = useState(false)
  const [repeatType, setRepeatType] = useState<-1 | EventRepeatType>(-1)

  const [colorId, setColorId] = useState<string | null>('1')

  const [isRepeatTypeDropdownOpen, setIsRepeatTypeDropdownOpen] =
    useState(false)
  const [isStartDateCalendarOpen, setIsStartDateCalendarOpen] = useState(false)
  const [isEndDateCalendarOpen, setIsEndDateCalendarOpen] = useState(false)
  useEffect(() => {
    if (!event) return
    setTitle(event.title ?? '')
    setLocation(event.location ?? '')
    setDescription(event.description ?? '')
    setStartDate(event.startDate)
    setEndDate(event.endDate)
    setIsAllDay(event.isAllDay)
    setColorId(event.colorId ?? null)
  }, [event])

  const repeatTypeDropdownData: RepeatTypeItem[] = [
    {
      leftLabel: 'Ne se répète pas',
      rightLabel: '',
      onClickHandler: () => {
        setRepeatType(-1)
        setIsRepeatTypeDropdownOpen(false)
      },
    },
    {
      leftLabel: 'Quotidien',
      rightLabel: '',
      onClickHandler: () => {
        setRepeatType(EventRepeatTypes.DAILY)
        setIsRepeatTypeDropdownOpen(false)
      },
    },
    {
      leftLabel: 'Hebdomadaire',
      rightLabel: '',
      onClickHandler: () => {
        setRepeatType(EventRepeatTypes.WEEKLY)
        setIsRepeatTypeDropdownOpen(false)
      },
    },
    {
      leftLabel: 'Mensuel',
      rightLabel: '',
      onClickHandler: () => {
        setRepeatType(EventRepeatTypes.MONTHLY)
        setIsRepeatTypeDropdownOpen(false)
      },
    },
  ]

  const onToggleAllDay = (newVal: boolean) => {
    if (newVal) {
      const updatedStartDate = startOfDay(new Date(startDate))
      const updatedEndDate = endOfDay(new Date(endDate))
      setStartDate(updatedStartDate.toISOString())
      setEndDate(updatedEndDate.toISOString())
    } else {
      const now = new Date()
      const curHour = getHours(now)
      const curMin = getMinutes(now)
      setStartDate(
        setDate(new Date(startDate), {
          hours: curHour,
          minutes: curMin,
        }).toISOString(),
      )
      setEndDate(
        setDate(new Date(endDate), {
          hours: curHour,
          minutes: curMin,
        }).toISOString(),
      )
    }

    setIsAllDay(newVal)
  }

  const onChangeDate = (target: 'start' | 'end', newDateVal: Date) => {
    const base = new Date(newDateVal)
    const year = getYear(base)
    const month = getMonth(base)
    const date = getDate(base)
    if (target === 'start') {
      const updated = setDate(new Date(startDate), { year, month, date })
      setStartDate(updated.toISOString())
      if (isBefore(new Date(endDate), updated)) {
        setEndDate(updated.toISOString())
      }
      setIsStartDateCalendarOpen(false)
    } else {
      const updated = setDate(new Date(endDate), { year, month, date })
      setEndDate(updated.toISOString())
      if (isBefore(updated, new Date(startDate))) {
        setStartDate(updated.toISOString())
      }
      setIsEndDateCalendarOpen(false)
    }
  }

  const onBlurInput = (target: 'start' | 'end', value: string) => {
    const [valid, hours, minutes] = isValidTime(value)
    if (target === 'start') {
      if (valid) {
        const newStartDate = setDate(new Date(startDate), {
          hours,
          minutes,
        })
        if (isAfter(newStartDate, new Date(endDate))) {
          const newEndDate = setDate(new Date(endDate), {
            hours,
            minutes,
          })
          setEndDate(newEndDate.toISOString())
        }
        setStartDate(newStartDate.toISOString())
      }
      setShowStartDateInput(false)
    } else {
      if (valid) {
        const newEndDate = setDate(new Date(endDate), { hours, minutes })
        if (isBefore(newEndDate, new Date(startDate))) {
          const newStartDate = setDate(new Date(startDate), {
            hours,
            minutes,
          })
          setStartDate(newStartDate.toISOString())
        }
        setEndDate(newEndDate.toISOString())
      }
      setShowEndDateInput(false)
    }
  }

  const handleSaveClick = async () => {
    if (!event) return
    const payload = {
      title,
      description,
      location,
      startDate,
      endDate,
      isAllDay,
      colorId,
    }

    const res = await fetch(`/api/google/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('Failed to update event')
      return
    }

    const updated: UiEvent = await res.json()
    onUpdated(updated)
    onClose()
  }

  useEffect(() => {
    setStartDateInputValue(
      format(new Date(startDate), 'HH:mm', {
        locale: fr,
      }),
    )
  }, [startDate])

  useEffect(() => {
    setEndDateInputValue(
      format(new Date(endDate), 'HH:mm', {
        locale: fr,
      }),
    )
  }, [endDate])

  useEffect(() => {
    if (showStartDateInput && startDateInputRef.current) {
      startDateInputRef.current.focus()
    }
    if (showEndDateInput && endDateInputRef.current) {
      endDateInputRef.current.focus()
    }
  }, [showStartDateInput, showEndDateInput])

  if (!isOpen || !event) return null

  const headerColorClass = getColorClass(colorId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-xl rounded-md shadow-lg">
        <div
          className={`flex items-center justify-between px-3 py-1 rounded-t-md bg-opacity-20 ${headerColorClass}`}
        >
          <IconButton
            label="Fermer"
            size="small"
            tooltipLocation="bottom"
            imgComponent={
              <MdClose size="24px" color="rgba(75, 85, 99)" />
            }
            onClickHandler={onClose}
          />
        </div>

        <div className="pt-2 px-4 pb-4">
          {/* Titre */}
          <div className="flex py-2">
            <input
              type="text"
              value={title}
              placeholder="Titre"
              onChange={e => setTitle(e.target.value)}
              className="w-full text-2xl font-normal border-b outline-none"
            />
          </div>

          {/* Bloc date / heure */}
          <div className="flex py-2">
            <div className="flex items-start justify-center">
              <MdAccessTime size="20px" color="rgba(75, 85, 99)" />
            </div>
            <div className="flex flex-col flex-auto pl-6 text-sm text-gray-500">
              <div className="flex items-center justify-start">
                {/* Start date */}
                <div className="relative">
                  <div
                    className="px-1 transition rounded-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => setIsStartDateCalendarOpen(true)}
                  >
                    {format(new Date(startDate), 'EEEE d MMMM', {
                      locale: fr,
                    })}
                  </div>
                  {isStartDateCalendarOpen && (
                    <div className="absolute z-50 w-64 bg-white h-min top-full dropdownBoxShadow">
                      <Calendar
                        targetDate={startDate}
                        onClickDate={newDate =>
                          onChangeDate('start', newDate)
                        }
                        isModal
                        onClose={() => setIsStartDateCalendarOpen(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Start time */}
                {!isAllDay && (
                  <div>
                    {showStartDateInput ? (
                      <input
                        ref={startDateInputRef}
                        type="text"
                        value={startDateInputValue}
                        className="w-20 text-center border rounded-md outline-none"
                        onChange={e =>
                          setStartDateInputValue(e.target.value)
                        }
                        onBlur={e =>
                          onBlurInput('start', e.target.value)
                        }
                      />
                    ) : (
                      <div
                        className="px-1 transition rounded-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => setShowStartDateInput(true)}
                      >
                        {format(new Date(startDate), 'HH:mm', {
                          locale: fr,
                        })}
                      </div>
                    )}
                  </div>
                )}

                <span className="px-1">-</span>

                {/* End time */}
                {!isAllDay && (
                  <div>
                    {showEndDateInput ? (
                      <input
                        ref={endDateInputRef}
                        type="text"
                        value={endDateInputValue}
                        className="w-20 text-center border rounded-md outline-none"
                        onChange={e =>
                          setEndDateInputValue(e.target.value)
                        }
                        onBlur={e =>
                          onBlurInput('end', e.target.value)
                        }
                      />
                    ) : (
                      <div
                        className="px-1 transition rounded-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => setShowEndDateInput(true)}
                      >
                        {format(new Date(endDate), 'HH:mm', {
                          locale: fr,
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* End date */}
                <div className="relative">
                  <div
                    className="px-1 transition rounded-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => setIsEndDateCalendarOpen(true)}
                  >
                    {format(new Date(endDate), 'EEEE d MMMM', {
                      locale: fr,
                    })}
                  </div>
                  {isEndDateCalendarOpen && (
                    <div className="absolute z-50 w-64 bg-white h-min top-full dropdownBoxShadow">
                      <Calendar
                        targetDate={endDate}
                        onClickDate={newDate =>
                          onChangeDate('end', newDate)
                        }
                        isModal
                        onClose={() => setIsEndDateCalendarOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* All day */}
              <div className="flex items-center mt-2 -ml-1">
                <div className="mr-1.5">
                  <IconButton
                    label="Toute la journée"
                    size="small"
                    tooltipLocation="bottom"
                    imgComponent={
                      isAllDay ? (
                        <MdCheckBox size="24px" color="gray" />
                      ) : (
                        <MdCheckBoxOutlineBlank
                          size="24px"
                          color="gray"
                        />
                      )
                    }
                    onClickHandler={() => onToggleAllDay(!isAllDay)}
                  />
                </div>
                <div>Toute la journée</div>
              </div>

              {/* Répétition UI only */}
              <div className="relative mt-2">
                <button
                  className="flex px-2 py-1 -ml-1 transition rounded-md hover:bg-gray-100"
                  onClick={() => setIsRepeatTypeDropdownOpen(true)}
                >
                  <span className="mr-0.5">
                    {repeatTypeStringLookup[
                      repeatType as -1 | EventRepeatType
                    ]}
                  </span>
                  <MdArrowDropDown
                    size="18px"
                    color="rgba(75, 85, 99)"
                  />
                </button>
                {isRepeatTypeDropdownOpen && (
                  <Dropdown
                    data={repeatTypeDropdownData}
                    onCloseDropdown={() =>
                      setIsRepeatTypeDropdownOpen(false)
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center py-2 border-t">
            <div>
              <MdLocationOn size="20px" color="rgba(75, 85, 99)" />
            </div>
            <div className="flex-auto pl-6">
              <input
                type="text"
                value={location}
                placeholder="Lieu"
                onChange={e => setLocation(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-100 border-b outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex py-2 border-t">
            <div>
              <MdSubject size="20px" color="rgba(75, 85, 99)" />
            </div>
            <div className="flex-auto pl-6">
              <textarea
                value={description}
                placeholder="Description"
                onChange={e => setDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-gray-100 border-b outline-none resize-none"
              />
            </div>
          </div>

          {/* Couleur Google */}
          <div className="flex py-2 border-t border-b">
            <div>
              <MdColorLens size="20px" color="rgba(75, 85, 99)" />
            </div>
            <div className="flex flex-auto pl-6 flex-wrap gap-3 text-xs -mt-1.5">
              {GOOGLE_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`
                    flex flex-col items-center px-1 py-1.5 transition rounded-md cursor-pointer
                    border border-transparent
                    ${colorId === c.id ? 'border-gray-600' : ''}
                  `}
                  onClick={() => setColorId(c.id)}
                >
                  <span className="mb-1 tracking-wide text-gray-500 text-xxs">
                    {c.label}
                  </span>
                  <div
                    className={`
                      w-4 h-4 rounded-full
                      ${c.className}
                    `}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-3">
            <button
              className="px-4 py-2 mr-2 text-sm text-gray-700 border rounded-md"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              className={`px-4 py-2 text-sm text-white rounded-md ${getColorClass(
                colorId,
              )}`}
              onClick={handleSaveClick}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RepeatTypeItem {
  leftLabel: string
  rightLabel: string
  onClickHandler: () => void
}

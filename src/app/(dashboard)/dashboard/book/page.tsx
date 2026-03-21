'use client'

import { useState, useEffect, useActionState } from 'react'
import { createReservation, cancelReservation, type ReservationActionState } from '@/app/actions/reservations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Clock, CheckCircle2, XCircle, Users, Phone, X, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import { formatDateString, formatTime } from '@/lib/helpers/date.helper'

type Slot = {
  id: string
  name: string
  start_time: string
  end_time: string
  available: boolean
  booked_by_you: boolean
  reservation_id: string | null
}

type BoatWithSlots = {
  id: string
  name: string
  description: string | null
  capacity: number
  image_url: string | null
  slots: Slot[]
}

type UserReservation = {
  id: string
  date: string
  status: string
  boat_id: string
  boat: { name: string } | null
  time_slot: { name: string; start_time: string; end_time: string } | null
}

export default function BookPage() {
  const [state, formAction, pending] = useActionState<ReservationActionState, FormData>(createReservation, null)
  const today = new Date()
  const todayStr = formatDateString(today)

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(today)
  const [date, setDate] = useState(todayStr)
  const [availability, setAvailability] = useState<BoatWithSlots[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<{ boat_id: string; time_slot_id: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const [myReservations, setMyReservations] = useState<UserReservation[]>([])
  const [confirmingSidebarCancel, setConfirmingSidebarCancel] = useState<string | null>(null)
  const [sidebarCancelling, setSidebarCancelling] = useState<string | null>(null)
  const [highlightedBoat, setHighlightedBoat] = useState<string | null>(null)

  // Reset dismissed state when a new error comes in
  useEffect(() => {
    if (state?.error) setDismissedError(false)
  }, [state])

  const refreshMyReservations = () => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('reservations')
      .select('id, date, status, boat:boats(name), time_slot:time_slots(name, start_time, end_time)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('date', todayStr)
      .order('date', { ascending: true })
      .then(({ data: res }) => setMyReservations((res as unknown as UserReservation[]) ?? []))
  }

  const handleCancel = async (reservationId: string) => {
    setCancelling(reservationId)
    try {
      await cancelReservation(reservationId)
      setConfirmingCancel(null)
      // Re-fetch availability after cancel
      const params = new URLSearchParams({ date })
      if (userId) params.set('user_id', userId)
      const res = await fetch(`/api/reservations/available?${params}`)
      const data = await res.json()
      setAvailability(data.availability ?? [])
      refreshMyReservations()
    } finally {
      setCancelling(null)
    }
  }

  // Min date = today (same-day shows "call to schedule")
  const isSameDay = date === todayStr

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (uid) {
        supabase
          .from('reservations')
          .select('id, date, status, boat_id, boat:boats(name), time_slot:time_slots(name, start_time, end_time)')
          .eq('user_id', uid)
          .eq('status', 'active')
          .gte('date', todayStr)
          .order('date', { ascending: true })
          .then(({ data: res }) => setMyReservations((res as unknown as UserReservation[]) ?? []))
      }
    })
  }, [])

  const handleDaySelect = (day: Date | undefined) => {
    setSelectedDay(day)
    if (day) {
      setDate(formatDateString(day))
    } else {
      setDate('')
    }
  }

  useEffect(() => {
    if (!date || userId === null) {
      if (!date) setAvailability([])
      return
    }
    setLoading(true)
    setSelected(null)
    const params = new URLSearchParams({ date, user_id: userId })
    fetch(`/api/reservations/available?${params}`)
      .then((res) => res.json())
      .then((data) => setAvailability(data.availability ?? []))
      .finally(() => setLoading(false))
  }, [date, userId])

  return (
    <div className={`space-y-6 ${selected ? 'pb-24' : ''}`}>
      <h2 className="text-2xl font-bold tracking-tight">Book a Boat</h2>

      {state?.error && !dismissedError && (
        <div className="fixed left-1/2 top-4 z-50 w-full max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="flex-1 text-sm font-medium text-red-700 dark:text-red-300">{state.error}</p>
            <button
              type="button"
              onClick={() => setDismissedError(true)}
              className="cursor-pointer rounded-md p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Calendar */}
        <div className="w-full lg:sticky lg:top-6 lg:w-auto lg:shrink-0 lg:self-start">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={handleDaySelect}
                disabled={{ before: today }}
                className="!w-full lg:!w-[350px] [&_.rdp-root]:w-full [&_.rdp-month]:w-full [&_table]:w-full [&_td]:p-1 [&_th]:p-1 [&_button]:text-base"
              />
            </CardContent>
          </Card>

          {myReservations.length > 0 && (
            <Card className="mt-4 bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Your Upcoming Reservations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myReservations.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-md border border-border bg-background p-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{res.boat?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {res.date} &middot; {res.time_slot?.name} ({res.time_slot ? formatTime(res.time_slot.start_time) : ''} – {res.time_slot ? formatTime(res.time_slot.end_time) : ''})
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(res.date + 'T00:00:00')
                          setSelectedDay(d)
                          setDate(res.date)
                          setHighlightedBoat(res.boat_id)
                          // Scroll after availability loads, retry if element not found yet
                          const tryScroll = (attempts: number) => {
                            const el = document.getElementById(`boat-${res.boat_id}`)
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            } else if (attempts > 0) {
                              setTimeout(() => tryScroll(attempts - 1), 300)
                            }
                          }
                          setTimeout(() => tryScroll(5), 300)
                          // Remove highlight after 3 seconds
                          setTimeout(() => setHighlightedBoat(null), 3500)
                        }}
                        className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        View
                      </button>
                      {confirmingSidebarCancel !== res.id && (
                        <button
                          type="button"
                          onClick={() => setConfirmingSidebarCancel(res.id)}
                          className="cursor-pointer rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {confirmingSidebarCancel === res.id && (
                      <div className="mt-2 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
                          Cancel this reservation?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmingSidebarCancel(null)}
                            disabled={sidebarCancelling === res.id}
                            className="cursor-pointer rounded-md border border-border bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50 dark:bg-background"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            disabled={sidebarCancelling === res.id}
                            onClick={async () => {
                              setSidebarCancelling(res.id)
                              try {
                                await cancelReservation(res.id)
                                setConfirmingSidebarCancel(null)
                                refreshMyReservations()
                                if (date) {
                                  const params = new URLSearchParams({ date, user_id: userId! })
                                  const response = await fetch(`/api/reservations/available?${params}`)
                                  const data = await response.json()
                                  setAvailability(data.availability ?? [])
                                }
                              } finally {
                                setSidebarCancelling(null)
                              }
                            }}
                            className="cursor-pointer rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                          >
                            {sidebarCancelling === res.id ? 'Cancelling...' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Boats */}
        <div className="flex-1 space-y-4">
          {!date && (
            <p className="text-sm text-muted-foreground">Select a date from the calendar to see available boats.</p>
          )}

          {loading && <p className="text-sm text-muted-foreground">Loading available boats...</p>}

          {!loading && date && availability.length === 0 && (
            <p className="text-sm text-muted-foreground">No boats found for this date.</p>
          )}

          {!loading && isSameDay && availability.length > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <Phone className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Same-day booking requires a phone call</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Reservations require 24 hours advance notice. To book for today, please call us directly.</p>
              </div>
            </div>
          )}

          {!loading && availability.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {availability.map((boat) => (
                <Card key={boat.id} id={`boat-${boat.id}`} className={`flex flex-col overflow-hidden transition-all duration-500 ${highlightedBoat === boat.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  {boat.image_url && (
                    <div className="relative h-56 w-full">
                      <Image
                        src={boat.image_url}
                        alt={boat.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{boat.name}</CardTitle>
                    {boat.description && (
                      <p className="text-sm text-muted-foreground">{boat.description}</p>
                    )}
                    <div className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.03] px-3 py-1 text-sm font-semibold text-primary">
                      <Users className="h-4 w-4" />
                      {boat.capacity} {boat.capacity === 1 ? 'passenger' : 'passengers'}
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-2">
                    {boat.slots.map((slot) => {
                      const isSelected = selected?.boat_id === boat.id && selected?.time_slot_id === slot.id
                      const isYours = slot.booked_by_you
                      const isBooked = !slot.available && !isYours

                      if (isYours) {
                        const isConfirming = confirmingCancel === slot.reservation_id
                        const isCancelling = cancelling === slot.reservation_id
                        return (
                          <div
                            key={slot.id}
                            className="rounded-lg border-2 border-sky-400 bg-sky-50 p-3 dark:border-sky-500 dark:bg-sky-950/30"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                                  {slot.name}
                                </p>
                                <p className="text-xs text-sky-600/80 dark:text-sky-400/80">
                                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-medium text-white">
                                  Your Booking
                                </span>
                                {!isConfirming && slot.reservation_id && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingCancel(slot.reservation_id)}
                                    className="cursor-pointer rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                            {isConfirming && slot.reservation_id && (
                              <div className="mt-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                  Cancel this reservation?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingCancel(null)}
                                    disabled={isCancelling}
                                    className="cursor-pointer rounded-md border border-border bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50 dark:bg-background"
                                  >
                                    Keep
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancel(slot.reservation_id!)}
                                    disabled={isCancelling}
                                    className="cursor-pointer rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                                  >
                                    {isCancelling ? 'Cancelling...' : 'Confirm'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      if (isBooked) {
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/20"
                          >
                            <XCircle className="h-5 w-5 shrink-0 text-red-400 dark:text-red-500" />
                            <div className="flex-1">
                              <p className="text-sm text-red-400 line-through dark:text-red-400">
                                {slot.name}
                              </p>
                              <p className="text-xs text-red-300 dark:text-red-500/70">
                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                              </p>
                            </div>
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-500 dark:bg-red-950 dark:text-red-400">
                              Unavailable
                            </span>
                          </div>
                        )
                      }

                      if (isSameDay) {
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20"
                          >
                            <Phone className="h-5 w-5 shrink-0 text-amber-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                {slot.name}
                              </p>
                              <p className="text-xs text-amber-500/80 dark:text-amber-400/80">
                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                              </p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                              Call to schedule
                            </span>
                          </div>
                        )
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelected({ boat_id: boat.id, time_slot_id: slot.id })}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-transparent bg-accent/40 hover:border-primary/30 hover:bg-accent/70'
                          }`}
                        >
                          <Clock className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <p className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>
                              {slot.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                              Selected
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selected && (() => {
            const selectedBoat = availability.find((b) => b.id === selected.boat_id)
            const selectedSlot = selectedBoat?.slots.find((s) => s.id === selected.time_slot_id)
            return (
              <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <form action={formAction} className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                  <input type="hidden" name="date" value={date} />
                  <input type="hidden" name="boat_id" value={selected.boat_id} />
                  <input type="hidden" name="time_slot_id" value={selected.time_slot_id} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{selectedBoat?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedSlot?.name} &middot; {selectedSlot ? formatTime(selectedSlot.start_time) : ''} – {selectedSlot ? formatTime(selectedSlot.end_time) : ''}
                    </p>
                  </div>
                  <Button type="submit" disabled={pending} size="lg" className="shrink-0">
                    {pending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </form>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

'use client';

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface GoogleCalendar {
  id: string;
  summary: string;
  accessRole: string;
}

const ALLOWED_ROLES = ["administratif", "direction école", "direction collège", "direction lycée"];

function getWeekDates(baseDate: Date) {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GoogleAgenda() {
  const { isLoaded, user } = useUser();
  const [tokens, setTokens] = useState<any>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(new Date());
  const [modalEvent, setModalEvent] = useState<GoogleEvent | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<{id: string, offsetY: number} | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  function hasAccess() {
    if (!isLoaded || !user) return false;
    const rolesRaw = user.publicMetadata?.role;
    let roles: string[] = [];
    if (Array.isArray(rolesRaw)) roles = rolesRaw;
    else if (typeof rolesRaw === "string") roles = [rolesRaw];
    return roles.some(r => ALLOWED_ROLES.includes(r));
  }
  useEffect(() => {
    if (!hasAccess()) return;
    async function fetchTokens() {
      try {
        const res = await fetch("/api/google/gettokens");
        if (!res.ok) return;
        const data = await res.json();
        const email = Object.keys(data)[0];
        if (email) setTokens(data[email]);
      } catch (err) { console.error(err); }
    }
    fetchTokens();
  }, [isLoaded, user]);
  useEffect(() => {
    if (!tokens || !hasAccess()) return;
    async function fetchCalendars() {
      try {
        const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const data = await res.json();
        setCalendars(data.items || []);
        if (data.items?.length) setSelectedCalendar(data.items[0].id);
      } catch (err) { console.error(err); }
    }
    fetchCalendars();
  }, [tokens]);
  useEffect(() => {
    if (!tokens || !selectedCalendar || !hasAccess()) return;
    setLoading(true);
    async function fetchEvents() {
      try {
        const startISO = new Date(weekStart).toISOString();
        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 7);
        const endISO = endDate.toISOString();
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events?timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
        );
        const data = await res.json();
        setEvents(data.items || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchEvents();
  }, [tokens, selectedCalendar, weekStart]);
  async function saveEvent(evt: GoogleEvent) {
    if (!tokens || !selectedCalendar) return;
    const method = evt.id ? "PUT" : "POST";
    const url = evt.id  ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events/${evt.id}` : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events`;
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${tokens.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: evt.summary,
          start: { dateTime: evt.start.dateTime },
          end: { dateTime: evt.end.dateTime }
        }),
      });
      const newEvent = await res.json();
      setEvents(prev => method === "POST" ? [...prev, newEvent] : prev.map(e => e.id === newEvent.id ? newEvent : e));
      setModalEvent(null);
    } catch (err) { console.error(err); }
  }
  async function deleteEvent(evtId: string) {
    if (!tokens || !selectedCalendar) return;
    try {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(selectedCalendar)}/events/${evtId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      setEvents(prev => prev.filter(e => e.id !== evtId));
    } catch (err) { console.error(err); }
  }
  function onMouseDown(evt: React.MouseEvent, eventId: string) {
    const rect = (evt.target as HTMLElement).getBoundingClientRect();
    setDraggingEvent({ id: eventId, offsetY: evt.clientY - rect.top });
  }
  function onMouseMove(evt: React.MouseEvent) {
    if (!draggingEvent || !calendarRef.current) return;
    const calendarRect = calendarRef.current.getBoundingClientRect();
    const dayHeight = calendarRect.height;
    const minutesPerPixel = 24*60 / dayHeight;
    const newMinutes = (evt.clientY - calendarRect.top - draggingEvent.offsetY) * minutesPerPixel;
    const dayIndex = Math.floor((evt.clientX - calendarRect.left) / (calendarRect.width / 7));
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + dayIndex);
    newDate.setHours(0,0,0,0);
    newDate.setMinutes(newMinutes);
    setEvents(prev => prev.map(ev => ev.id === draggingEvent.id ? { ...ev, start: { dateTime: newDate.toISOString() } } : ev));
  }
  function onMouseUp() {
    if (draggingEvent) {
      const evt = events.find(e => e.id === draggingEvent.id);
      if (evt) saveEvent(evt);
    }
    setDraggingEvent(null);
  }
  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function today() { setWeekStart(new Date()); }
  if (!hasAccess()) return null;
  if (!tokens) return <a href="/api/google" className="btn">Connecter mon agenda Google</a>;
  const days = getWeekDates(weekStart);
  return (
    <div onMouseMove={onMouseMove} onMouseUp={onMouseUp} className="hidden">
      <h2>Google Agenda</h2>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button onClick={prevWeek}>{"<"}</button>
        <button onClick={today}>Aujourd'hui</button>
        <button onClick={nextWeek}>{">"}</button>

        <select value={selectedCalendar} onChange={e => setSelectedCalendar(e.target.value)}>
          {calendars.map(cal => (
            <option key={cal.id} value={cal.id}>{cal.summary} ({cal.accessRole})</option>
          ))}
        </select>
      </div>

      {loading && <p>Chargement...</p>}

      <div ref={calendarRef} style={{ display: "flex", border: "1px solid #ccc", height: "600px", position: "relative" }}>
        {/* Headers */}
        <div style={{ flex: 1 }}>
          {days.map(day => (
            <div key={day.toDateString()} style={{ textAlign: "center", borderBottom: "1px solid #ccc" }}>
              {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </div>
          ))}
        </div>
        {/* Body */}
        {days.map((day, dayIdx) => (
          <div key={day.toDateString()} style={{ flex: 1, borderLeft: "1px solid #ccc", position: "relative" }}>
            {events.filter(ev => {
              const evDate = ev.start.dateTime ? new Date(ev.start.dateTime) : null;
              return evDate && evDate.toDateString() === day.toDateString();
            }).map(ev => {
              const start = new Date(ev.start.dateTime!);
              const end = new Date(ev.end.dateTime!);
              const top = (start.getHours()*60 + start.getMinutes())/ (24*60) * 600;
              const height = (end.getTime() - start.getTime()) / (1000*60) / (24*60) * 600;
              return (
                <div key={ev.id} 
                  style={{
                    position: "absolute", top, height, left: 2, right: 2, background: "#90cdf4", padding: "2px", borderRadius: "4px", cursor: "move"
                  }}
                  onMouseDown={(e) => onMouseDown(e, ev.id)}
                  onDoubleClick={() => setModalEvent(ev)}
                >
                  {ev.summary}<br/>
                  {formatTime(ev.start.dateTime!)} - {formatTime(ev.end.dateTime!)}
                  <button onClick={() => deleteEvent(ev.id)} style={{ marginLeft: "4px" }}>🗑️</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalEvent && (
        <div style={{
          position: "fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center"
        }}>
          <form style={{ background:"#fff", padding:"1rem", borderRadius:"8px" }} onSubmit={e => {
            e.preventDefault();
            saveEvent(modalEvent);
          }}>
            <input type="text" value={modalEvent.summary} onChange={e => setModalEvent({...modalEvent, summary:e.target.value})} required />
            <input type="datetime-local" value={modalEvent.start.dateTime?.slice(0,16)} onChange={e => setModalEvent({...modalEvent, start:{dateTime:e.target.value}})} required />
            <input type="datetime-local" value={modalEvent.end.dateTime?.slice(0,16)} onChange={e => setModalEvent({...modalEvent, end:{dateTime:e.target.value}})} required />
            <button type="submit">Enregistrer</button>
            <button type="button" onClick={()=>setModalEvent(null)}>Annuler</button>
          </form>
        </div>
      )}
    </div>
  );
}

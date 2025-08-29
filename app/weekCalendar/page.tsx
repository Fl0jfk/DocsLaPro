"use client";

import { useEffect, useState } from "react";

type ScheduleData = {
  [person: string]: {
    [day: string]: { [timeRange: string]: string }[];
  };
};

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

// Couleurs par personne
const personColors: Record<string, string> = {
  Audrey: "bg-pink-400",
  Emmanuelle: "bg-blue-400",
  Sandrine: "bg-green-400",
  Christelle: "bg-purple-400",
  Karim: "bg-orange-400",
  Athéna: "bg-yellow-400"
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getBlockStyle(timeRange: string) {
  const [start, end] = timeRange.split("-");
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const dayStart = 7 * 60; // commence à 07:00
  const pixelsPerMinute = 1.1; // 1 minute = 1px
  return {
    top: `${(startMin - dayStart) * pixelsPerMinute}px`,
    height: `${(endMin - startMin) * pixelsPerMinute}px`
  };
}

export default function AgendaHebdo() {
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/semaine-lycée-GSON.json")
      .then((res) => res.json())
      .then((data: ScheduleData) => {
        setSchedule(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur de chargement JSON :", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement de l agenda...</div>;
  }

  // Regrouper les événements par jour et par personne
  const eventsByDay: {
    [day: string]: { person: string; timeRange: string; task: string }[];
  } = {};

  for (const [person, days] of Object.entries(schedule)) {
    for (const [day, events] of Object.entries(days)) {
      if (!eventsByDay[day]) eventsByDay[day] = [];
      for (const ev of events) {
        const [timeRange, task] = Object.entries(ev)[0];
        eventsByDay[day].push({ person, timeRange, task });
      }
    }
  }

  return (
    <div className="p-6 overflow-x-auto">
      <div className="grid grid-cols-5 gap-2 relative border-t border-l min-h-[800px]">
        {daysOfWeek.map((day) => {
          const dayEvents = eventsByDay[day] || [];
          // Extraire les personnes présentes ce jour
          const personsForDay = Array.from(new Set(dayEvents.map((e) => e.person)));

          return (
            <div key={day} className="relative border-r border-gray-300 min-h-[800px]">
              <h2 className="text-center font-semibold bg-gray-100 p-2 sticky top-0 z-10">{day}</h2>

              <div className="relative flex w-full min-h-[800px]">
                {personsForDay.map((person) => (
                  <div key={person} className="relative flex-1 border-l border-gray-200">
                    <h3 className="text-xs text-center font-medium bg-gray-50 sticky top-[32px] z-10">
                      {person}
                    </h3>
                    <div className="relative">
                      {dayEvents
                        .filter((e) => e.person === person)
                        .map((event, idx) => {
                          const style = getBlockStyle(event.timeRange);
                          return (
                            <div
                              key={idx}
                              className={`absolute w-[95%] mx-auto text-white text-xs rounded-md shadow ${personColors[person] || "bg-gray-400"}`}
                              style={style}
                            >
                              <div className="text-xs">{event.timeRange}</div>
                              <div>{event.task}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

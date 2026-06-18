"use client";

import { useEffect, useState } from "react";
import { dash } from "@/app/lib/dashboard-brand";

type WeatherPayload = {
  location: string;
  temperature: number | null;
  min: number | null;
  max: number | null;
  windKmh: number | null;
  label: string;
  icon: string;
};

export default function DashboardWeather() {
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) setWeather(data as WeatherPayload);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!weather || weather.temperature === null) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm ${dash.borderSoft}`}
      title={`Météo à ${weather.location}`}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {weather.icon}
      </span>
      <div className="min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${dash.label}`}>{weather.location}</p>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className={`text-lg font-black tabular-nums ${dash.ink}`}>{weather.temperature}°</span>
          <span className="text-xs font-semibold text-stone-600">{weather.label}</span>
        </p>
        {(weather.min !== null || weather.max !== null) && (
          <p className="text-[10px] font-medium text-stone-400">
            {weather.min !== null && weather.max !== null
              ? `${weather.min}° · ${weather.max}°`
              : weather.min !== null
                ? `Min ${weather.min}°`
                : `Max ${weather.max}°`}
            {weather.windKmh !== null ? ` · vent ${weather.windKmh} km/h` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

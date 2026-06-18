import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/intranet-auth";
import { SCHOOL } from "@/app/lib/school";
import { weatherCodeIcon, weatherCodeLabel } from "@/app/lib/weather-codes";

export const revalidate = 1800;

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
};

export async function GET() {
  const gate = await requireAuth();
  if (!gate.ok) return gate.response;

  const { latitude, longitude, city } = SCHOOL.address;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("timezone", "Europe/Paris");
  url.searchParams.set("forecast_days", "1");

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      return NextResponse.json({ error: "Météo indisponible." }, { status: 502 });
    }

    const data = (await res.json()) as OpenMeteoResponse;
    const code = data.current?.weather_code ?? data.daily?.weather_code?.[0] ?? 0;
    const temp = data.current?.temperature_2m;
    const min = data.daily?.temperature_2m_min?.[0];
    const max = data.daily?.temperature_2m_max?.[0];
    const wind = data.current?.wind_speed_10m;

    return NextResponse.json({
      location: city,
      temperature: typeof temp === "number" ? Math.round(temp) : null,
      min: typeof min === "number" ? Math.round(min) : null,
      max: typeof max === "number" ? Math.round(max) : null,
      windKmh: typeof wind === "number" ? Math.round(wind) : null,
      code,
      label: weatherCodeLabel(code),
      icon: weatherCodeIcon(code),
    });
  } catch (e) {
    console.error("[weather]", e);
    return NextResponse.json({ error: "Météo indisponible." }, { status: 500 });
  }
}

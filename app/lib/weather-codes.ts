/** Libellés WMO (Open-Meteo) en français — https://open-meteo.com/en/docs */
const WMO_LABELS: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Peu nuageux",
  2: "Éclaircies",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine dense",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante dense",
  61: "Pluie faible",
  63: "Pluie",
  65: "Forte pluie",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige faible",
  73: "Neige",
  75: "Forte neige",
  77: "Grains de neige",
  80: "Averses faibles",
  81: "Averses",
  82: "Fortes averses",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent",
};

const WMO_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "🌨️",
  77: "🌨️",
  80: "🌦️",
  81: "🌧️",
  82: "🌧️",
  85: "🌨️",
  86: "🌨️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

export function weatherCodeLabel(code: number): string {
  return WMO_LABELS[code] ?? "Conditions variables";
}

export function weatherCodeIcon(code: number): string {
  return WMO_ICONS[code] ?? "🌡️";
}

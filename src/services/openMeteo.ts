import type { GeoLocation, TemperatureUnit, WeatherData } from '../types/weather';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export const PRESET_CITIES: GeoLocation[] = [
  {
    id: 1850147,
    name: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.6917,
    country_code: 'JP',
    country: 'Japan',
    admin1: 'Tokyo',
    timezone: 'Asia/Tokyo',
  },
  {
    id: 5128581,
    name: 'New York',
    latitude: 40.71427,
    longitude: -74.00597,
    country_code: 'US',
    country: 'United States',
    admin1: 'New York',
    timezone: 'America/New_York',
  },
  {
    id: 2643743,
    name: 'London',
    latitude: 51.50853,
    longitude: -0.12574,
    country_code: 'GB',
    country: 'United Kingdom',
    admin1: 'England',
    timezone: 'Europe/London',
  },
  {
    id: 3413829,
    name: 'Reykjavik',
    latitude: 64.13548,
    longitude: -21.89541,
    country_code: 'IS',
    country: 'Iceland',
    admin1: 'Capital Region',
    timezone: 'Atlantic/Reykjavik',
  },
  {
    id: 360630,
    name: 'Cairo',
    latitude: 30.06263,
    longitude: 31.24967,
    country_code: 'EG',
    country: 'Egypt',
    admin1: 'Cairo',
    timezone: 'Africa/Cairo',
  },
  {
    id: 2147714,
    name: 'Sydney',
    latitude: -33.86785,
    longitude: 151.20732,
    country_code: 'AU',
    country: 'Australia',
    admin1: 'New South Wales',
    timezone: 'Australia/Sydney',
  },
];

interface GeocodingApiResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    country_code?: string;
    country?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
  }>;
}

interface ForecastApiResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  current_units: {
    temperature_2m: string;
    wind_speed_10m: string;
  };
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max?: Array<number | null>;
  };
}

/**
 * Searches cities via Open-Meteo Geocoding API (/v1/search).
 */
export async function searchCities(
  query: string,
  count = 6,
  signal?: AbortSignal
): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: String(count),
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo Geocoding request failed (${response.status}).`);
  }

  const data = (await response.json()) as GeocodingApiResponse;
  if (!data.results || data.results.length === 0) {
    return [];
  }

  return data.results.map((item) => ({
    id: item.id,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    elevation: item.elevation,
    country_code: item.country_code,
    country: item.country,
    admin1: item.admin1,
    timezone: item.timezone,
    population: item.population,
  }));
}

/**
 * Fetches current weather and 7-day daily high/low forecast from Open-Meteo (/v1/forecast).
 * Passes timezone=auto as required by Open-Meteo documentation when querying daily variables.
 */
export async function fetchWeatherForLocation(
  location: GeoLocation,
  unit: TemperatureUnit,
  signal?: AbortSignal
): Promise<WeatherData> {
  const windSpeedUnit = unit === 'fahrenheit' ? 'mph' : 'kmh';

  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'precipitation_probability_max',
    ].join(','),
    temperature_unit: unit,
    wind_speed_unit: windSpeedUnit,
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(`${FORECAST_ENDPOINT}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo Weather request failed (${response.status}).`);
  }

  const data = (await response.json()) as ForecastApiResponse;

  const daily = data.daily.time.map((date, idx) => ({
    date,
    weatherCode: data.daily.weather_code[idx],
    tempMax: data.daily.temperature_2m_max[idx],
    tempMin: data.daily.temperature_2m_min[idx],
    sunrise: data.daily.sunrise[idx],
    sunset: data.daily.sunset[idx],
    precipitationProbabilityMax:
      data.daily.precipitation_probability_max?.[idx] ?? null,
  }));

  return {
    location,
    unit,
    temperatureSymbol: unit === 'fahrenheit' ? '°F' : '°C',
    windSpeedUnit: data.current_units?.wind_speed_10m ?? (unit === 'fahrenheit' ? 'mp/h' : 'km/h'),
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      relativeHumidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      isDay: data.current.is_day === 1,
    },
    daily,
    fetchedAt: new Date().toISOString(),
  };
}

export interface WmoWeatherInfo {
  label: string;
  category: 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';
}

/**
 * Official WMO Weather interpretation codes (WW) documented by Open-Meteo.
 */
export function describeWmoCode(code: number): WmoWeatherInfo {
  switch (code) {
    case 0:
      return { label: 'Clear sky', category: 'clear' };
    case 1:
      return { label: 'Mainly clear', category: 'clear' };
    case 2:
      return { label: 'Partly cloudy', category: 'cloudy' };
    case 3:
      return { label: 'Overcast', category: 'cloudy' };
    case 45:
      return { label: 'Fog', category: 'fog' };
    case 48:
      return { label: 'Depositing rime fog', category: 'fog' };
    case 51:
      return { label: 'Light drizzle', category: 'rain' };
    case 53:
      return { label: 'Moderate drizzle', category: 'rain' };
    case 55:
      return { label: 'Dense drizzle', category: 'rain' };
    case 56:
      return { label: 'Light freezing drizzle', category: 'rain' };
    case 57:
      return { label: 'Dense freezing drizzle', category: 'rain' };
    case 61:
      return { label: 'Slight rain', category: 'rain' };
    case 63:
      return { label: 'Moderate rain', category: 'rain' };
    case 65:
      return { label: 'Heavy rain', category: 'rain' };
    case 66:
      return { label: 'Light freezing rain', category: 'rain' };
    case 67:
      return { label: 'Heavy freezing rain', category: 'rain' };
    case 71:
      return { label: 'Slight snowfall', category: 'snow' };
    case 73:
      return { label: 'Moderate snowfall', category: 'snow' };
    case 75:
      return { label: 'Heavy snowfall', category: 'snow' };
    case 77:
      return { label: 'Snow grains', category: 'snow' };
    case 80:
      return { label: 'Slight rain showers', category: 'rain' };
    case 81:
      return { label: 'Moderate rain showers', category: 'rain' };
    case 82:
      return { label: 'Violent rain showers', category: 'rain' };
    case 85:
      return { label: 'Slight snow showers', category: 'snow' };
    case 86:
      return { label: 'Heavy snow showers', category: 'snow' };
    case 95:
      return { label: 'Thunderstorm', category: 'storm' };
    case 96:
      return { label: 'Thunderstorm with slight hail', category: 'storm' };
    case 99:
      return { label: 'Thunderstorm with heavy hail', category: 'storm' };
    default:
      return { label: `Weather code ${code}`, category: 'cloudy' };
  }
}

export function formatLocationSubtitle(location: GeoLocation): string {
  const parts: string[] = [];
  if (location.admin1 && location.admin1 !== location.name) {
    parts.push(location.admin1);
  }
  if (location.country) {
    parts.push(location.country);
  }
  return parts.join(', ');
}

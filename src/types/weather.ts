export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface GeoLocation {
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
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
}

export interface DailyForecastDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  precipitationProbabilityMax: number | null;
}

export interface WeatherData {
  location: GeoLocation;
  unit: TemperatureUnit;
  temperatureSymbol: '°C' | '°F';
  windSpeedUnit: string;
  timezone: string;
  timezoneAbbreviation: string;
  current: CurrentWeather;
  daily: DailyForecastDay[];
  fetchedAt: string;
}

export interface PokemonStat {
  name: string;
  baseStat: number;
}

export interface PokemonRecord {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  artworkUrl: string | null;
  shinyArtworkUrl: string | null;
  spriteUrl: string | null;
  heightMeters: number;
  weightKg: number;
  abilities: string[];
  stats: PokemonStat[];
  cryUrl: string | null;
}

export type PokemonLookupResult =
  | {
      status: 'found';
      pokedexNumber: number;
      pokemon: PokemonRecord;
    }
  | {
      status: 'out-of-range';
      pokedexNumber: number;
      reason: string;
    }
  | {
      status: 'error';
      pokedexNumber: number;
      reason: string;
    };

import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  RefreshCw,
  Snowflake,
  Sun,
} from 'lucide-react';
import { describeWmoCode, formatLocationSubtitle } from '../services/openMeteo';
import {
  floorTemperatureToPokedexId,
  formatPokedexNumber,
  getTypeAccentHex,
} from '../services/pokeApi';
import {
  formatTemperatureMagnitude,
  isNegativeTemperature,
} from '../services/temperature';
import { NegativeReadingBadge } from './PokeballIcon';
import type {
  PokemonLookupResult,
  PokemonRecord,
  WeatherData,
} from '../types/weather';

interface CurrentWeatherHeroProps {
  weather: WeatherData;
  lookup: PokemonLookupResult | null;
  isLoadingPokemon: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onInspectPokemon: (
    pokemon: PokemonRecord,
    contextLabel: string,
    rawTemp: number
  ) => void;
}

function HeroWeatherIcon({ code }: { code: number }) {
  const info = describeWmoCode(code);
  switch (info.category) {
    case 'clear':
      return <Sun className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />;
    case 'fog':
      return <CloudFog className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />;
    case 'rain':
      return <CloudRain className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />;
    case 'snow':
      return <CloudSnow className="w-5 h-5 text-sky-600 shrink-0" aria-hidden="true" />;
    case 'storm':
      return (
        <CloudLightning className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden="true" />
      );
    default:
      return <Cloud className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />;
  }
}

function formatLocalObservationTime(isoLocal: string): string {
  // Open-Meteo returns local ISO string without offset when timezone=auto (e.g. "2026-11-18T14:30")
  const parts = isoLocal.split('T');
  if (parts.length < 2) return isoLocal;
  const [datePart, timePart] = parts;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = Number(hourStr);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedDate}, ${hour12}:${minuteStr} ${period}`;
}

export function CurrentWeatherHero({
  weather,
  lookup,
  isLoadingPokemon,
  onRefresh,
  isRefreshing,
  onInspectPokemon,
}: CurrentWeatherHeroProps) {
  const [showShiny, setShowShiny] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { current, location, temperatureSymbol, windSpeedUnit, timezoneAbbreviation } =
    weather;
  const flooredId = floorTemperatureToPokedexId(current.temperature);
  const isNegative = isNegativeTemperature(current.temperature);
  const pokemon = lookup?.status === 'found' ? lookup.pokemon : null;
  const wmo = describeWmoCode(current.weatherCode);
  const subtitle = formatLocationSubtitle(location);
  const accentHex = pokemon ? getTypeAccentHex(pokemon.types[0]) : '#334155';

  const activeArtwork =
    pokemon &&
    (showShiny && pokemon.shinyArtworkUrl ? pokemon.shinyArtworkUrl : pokemon.artworkUrl);

  useEffect(() => {
    setImageError(false);
    setShowShiny(false);
  }, [pokemon?.id]);

  return (
    <section
      id="today"
      aria-label="Current weather and matched Pokémon"
      className={`scroll-mt-24 bg-white border border-slate-200 rounded-2xl overflow-hidden ${
        isNegative ? 'negative-scheme' : ''
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Current Meteorological Observation */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-slate-200">
          <div className="space-y-4">
            {/* Location & Coordinates */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                  {location.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
                  {subtitle && <span>{subtitle}</span>}
                  {subtitle && <span aria-hidden="true">·</span>}
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    {Math.abs(location.latitude).toFixed(2)}°
                    {location.latitude >= 0 ? 'N' : 'S'},{' '}
                    {Math.abs(location.longitude).toFixed(2)}°
                    {location.longitude >= 0 ? 'E' : 'W'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh weather data"
                title="Refresh weather data"
                className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D93829]"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Observation Timestamp & Condition */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <HeroWeatherIcon code={current.weatherCode} />
                <span>{wmo.label}</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {formatLocalObservationTime(current.time)} {timezoneAbbreviation}
              </span>
            </div>

            {/* Primary Temperature Reading */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
                <span>Current Temperature</span>
                {isNegative && <NegativeReadingBadge />}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-6xl sm:text-7xl font-semibold tracking-tight text-slate-900 tabular-nums leading-none">
                  {formatTemperatureMagnitude(current.temperature)}
                </span>
                <span className="font-mono text-3xl text-slate-400 font-normal">
                  {temperatureSymbol}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Decimal discarded:{' '}
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formatTemperatureMagnitude(current.temperature)}
                  {temperatureSymbol}
                </span>{' '}
                floors to{' '}
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {flooredId}
                </span>
                {pokemon ? (
                  <>
                    {' '}
                    →{' '}
                    <span className="font-semibold text-slate-900">
                      {formatPokedexNumber(pokemon.id)} {pokemon.displayName}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* Hairline-Divided Atmospheric Metrics (Zero Pills) */}
          <dl className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div>
              <dt className="text-xs text-slate-500">Feels like</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {formatTemperatureMagnitude(current.apparentTemperature)}
                {temperatureSymbol}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Humidity</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {Math.round(current.relativeHumidity)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Wind</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {current.windSpeed.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {windSpeedUnit}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Right Column: Matched Current Pokémon Showcase */}
        <div
          className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6"
          style={{
            background: pokemon
              ? `radial-gradient(circle at 65% 42%, ${accentHex}12 0%, #FFFFFF 68%)`
              : '#FAFBFD',
          }}
        >
          {isLoadingPokemon ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-52 h-52 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-6 w-44 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : pokemon ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Current Temperature Match</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      National Pokédex {formatPokedexNumber(pokemon.id)}
                    </span>
                  </div>
                  <h2 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                    {pokemon.displayName}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <span>{pokemon.types.join(' / ')}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {pokemon.heightMeters.toFixed(1)} m / {pokemon.weightKg.toFixed(1)} kg
                    </span>
                  </div>
                </div>

                {pokemon.shinyArtworkUrl && (
                  <div
                    role="group"
                    aria-label="Artwork variant"
                    className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setShowShiny(false)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        !showShiny
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowShiny(true)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        showShiny
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Shiny
                    </button>
                  </div>
                )}
              </div>

              {/* Official Artwork Stage */}
              <div className="flex-1 flex items-center justify-center py-2">
                {activeArtwork && !imageError ? (
                  <img
                    src={activeArtwork}
                    alt={`${pokemon.displayName} official Pokédex artwork (#${pokemon.id})`}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain drop-shadow-[0_14px_24px_rgba(15,23,42,0.12)] transition-transform duration-200 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-56 h-56 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-center p-6">
                    <span className="font-mono text-3xl font-bold text-slate-400 tabular-nums">
                      {formatPokedexNumber(pokemon.id)}
                    </span>
                    <span className="mt-2 text-sm text-slate-500">
                      {pokemon.displayName}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Action & Key Abilities Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="text-xs text-slate-500">
                  <span className="text-slate-400 mr-1.5">Abilities:</span>
                  <span className="text-slate-700 font-medium">
                    {pokemon.abilities.join(' · ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onInspectPokemon(pokemon, 'Current Temperature', current.temperature)
                  }
                  className="text-sm font-semibold text-slate-900 hover:text-[#D93829] underline underline-offset-4 decoration-slate-300 hover:decoration-[#D93829] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Inspect Pokédex stats →
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-10 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Snowflake className="w-9 h-9" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <div className="font-mono text-xs text-slate-500 tabular-nums">
                  Floored Value: {flooredId}
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  No Pokémon Matches {flooredId}
                  {temperatureSymbol}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lookup && lookup.status !== 'found'
                    ? lookup.reason
                    : 'The National Pokédex begins at #001 (Bulbasaur). Try switching to Fahrenheit (°F) to explore higher Pokédex numbers.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

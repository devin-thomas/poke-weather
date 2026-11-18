import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { CitySearchBar } from './components/CitySearchBar';
import { CurrentWeatherHero } from './components/CurrentWeatherHero';
import { Header } from './components/Header';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { PokeballIcon } from './components/PokeballIcon';
import { TemperaturePokemonCard } from './components/TemperaturePokemonCard';
import { WeeklyForecastTable } from './components/WeeklyForecastTable';
import {
  PRESET_CITIES,
  fetchWeatherForLocation,
} from './services/openMeteo';
import {
  fetchPokemonBatch,
  floorTemperatureToPokedexId,
} from './services/pokeApi';
import type {
  GeoLocation,
  PokemonLookupResult,
  PokemonRecord,
  TemperatureUnit,
  WeatherData,
} from './types/weather';

interface InspectedPokemonState {
  pokemon: PokemonRecord;
  contextLabel: string;
  rawTemperature: number;
}

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation>(
    PRESET_CITIES[0]
  );
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pokemonMap, setPokemonMap] = useState<Map<number, PokemonLookupResult>>(
    () => new Map()
  );
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingPokemon, setIsLoadingPokemon] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [inspected, setInspected] = useState<InspectedPokemonState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;

    async function loadWeatherAndPokemon() {
      setIsLoadingWeather(true);
      setErrorMessage(null);

      try {
        const weatherResult = await fetchWeatherForLocation(
          selectedLocation,
          unit,
          controller.signal
        );
        if (isCancelled) return;
        setWeather(weatherResult);
        setIsLoadingWeather(false);

        // Gather all floored integer temperatures: current + every daily high and low.
        const numbersToLookup: number[] = [
          floorTemperatureToPokedexId(weatherResult.current.temperature),
        ];
        for (const day of weatherResult.daily) {
          numbersToLookup.push(floorTemperatureToPokedexId(day.tempMax));
          numbersToLookup.push(floorTemperatureToPokedexId(day.tempMin));
        }

        setIsLoadingPokemon(true);
        const fetchedMap = await fetchPokemonBatch(numbersToLookup);
        if (isCancelled) return;
        setPokemonMap(fetchedMap);
      } catch (err) {
        if ((err as Error).name === 'AbortError' || isCancelled) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to load weather data from Open-Meteo.'
        );
      } finally {
        if (!isCancelled) {
          setIsLoadingWeather(false);
          setIsLoadingPokemon(false);
        }
      }
    }

    loadWeatherAndPokemon();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [selectedLocation, unit, refreshNonce]);

  const handleSelectLocation = useCallback((location: GeoLocation) => {
    setLocationNotice(null);
    setSelectedLocation(location);
  }, []);

  const handleUnitChange = useCallback((nextUnit: TemperatureUnit) => {
    setUnit(nextUnit);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationNotice(
        'Geolocation is not supported in this browser. Search for any city below.'
      );
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({
          id: Math.round(latitude * 10000) + Math.round(longitude * 10000),
          name: 'Your Location',
          latitude,
          longitude,
          country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        });
        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationNotice(
            'Location permission was denied. You can still search for any city below.'
          );
        } else {
          setLocationNotice(
            'Could not determine your current coordinates. Search for a city below.'
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const handleInspectPokemon = useCallback(
    (pokemon: PokemonRecord, contextLabel: string, rawTemperature: number) => {
      setInspected({ pokemon, contextLabel, rawTemperature });
    },
    []
  );

  const todayForecast = weather?.daily[0] ?? null;
  const currentFlooredId = weather
    ? floorTemperatureToPokedexId(weather.current.temperature)
    : null;
  const highFlooredId = todayForecast
    ? floorTemperatureToPokedexId(todayForecast.tempMax)
    : null;
  const lowFlooredId = todayForecast
    ? floorTemperatureToPokedexId(todayForecast.tempMin)
    : null;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F7F9] text-slate-900">
      <Header onLocateMe={handleLocateMe} isLocating={isLocating} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* City Search & Unit Switcher */}
        <CitySearchBar
          selectedLocation={selectedLocation}
          unit={unit}
          onSelectLocation={handleSelectLocation}
          onUnitChange={handleUnitChange}
          isLoadingWeather={isLoadingWeather}
        />

        {locationNotice && (
          <div
            role="status"
            className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
          >
            <span>{locationNotice}</span>
            <button
              type="button"
              onClick={() => setLocationNotice(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error State */}
        {errorMessage ? (
          <section
            role="alert"
            className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-3.5">
              <AlertCircle
                className="w-5 h-5 text-[#D93829] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Weather data unavailable
                </h2>
                <p className="text-sm text-slate-600 mt-1">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </section>
        ) : isLoadingWeather && !weather ? (
          /* Initial Loading Skeleton */
          <div className="space-y-6" aria-busy="true" aria-label="Loading weather">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-4">
                <div className="h-9 w-48 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                <div className="h-20 w-44 bg-slate-100 rounded-xl animate-pulse mt-6" />
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col items-center justify-center gap-4 py-6">
                <div className="w-56 h-56 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-7 w-44 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-56 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              <div className="h-56 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        ) : weather ? (
          <>
            {/* Focal Anchor: Current Temperature & Matched Pokémon */}
            <CurrentWeatherHero
              weather={weather}
              lookup={
                currentFlooredId !== null
                  ? pokemonMap.get(currentFlooredId) ?? null
                  : null
              }
              isLoadingPokemon={isLoadingPokemon && !pokemonMap.has(currentFlooredId ?? -999)}
              onRefresh={handleRefresh}
              isRefreshing={isLoadingWeather}
              onInspectPokemon={handleInspectPokemon}
            />

            {/* Daily Range: Today's High & Today's Low Pokémon */}
            {todayForecast && (
              <section
                id="daily-range"
                aria-label="Today's High and Low Pokémon"
                className="scroll-mt-24 space-y-4"
              >
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Today&apos;s High &amp; Low
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Daily peak and overnight low from Open-Meteo matched to their floored National Pokédex numbers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TemperaturePokemonCard
                    label="Today's High"
                    sublabel={`Daily maximum · ${todayForecast.date}`}
                    temperature={todayForecast.tempMax}
                    temperatureSymbol={weather.temperatureSymbol}
                    lookup={
                      highFlooredId !== null
                        ? pokemonMap.get(highFlooredId) ?? null
                        : null
                    }
                    isLoading={
                      isLoadingPokemon &&
                      highFlooredId !== null &&
                      !pokemonMap.has(highFlooredId)
                    }
                    variant="high"
                    onInspectPokemon={handleInspectPokemon}
                  />

                  <TemperaturePokemonCard
                    label="Today's Low"
                    sublabel={`Daily minimum · ${todayForecast.date}`}
                    temperature={todayForecast.tempMin}
                    temperatureSymbol={weather.temperatureSymbol}
                    lookup={
                      lowFlooredId !== null
                        ? pokemonMap.get(lowFlooredId) ?? null
                        : null
                    }
                    isLoading={
                      isLoadingPokemon &&
                      lowFlooredId !== null &&
                      !pokemonMap.has(lowFlooredId)
                    }
                    variant="low"
                    onInspectPokemon={handleInspectPokemon}
                  />
                </div>
              </section>
            )}

            {/* 7-Day Forecast Table */}
            <WeeklyForecastTable
              days={weather.daily}
              temperatureSymbol={weather.temperatureSymbol}
              pokemonMap={pokemonMap}
              isLoadingPokemon={isLoadingPokemon}
              onInspectPokemon={handleInspectPokemon}
            />
          </>
        ) : null}

        {/* Editorial Reference: How Temperature-to-Pokédex Flooring Works */}
        <section
          id="how-it-maps"
          className="scroll-mt-24 border-t border-slate-200 pt-8 pb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900">
                01. Floor to Whole Number
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every temperature from Open-Meteo is floored with{' '}
                <code className="font-mono text-xs text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded">
                  Math.floor()
                </code>{' '}
                so decimals are discarded—for example, 9.8° becomes 9 (#009 Blastoise) and 6.4° becomes 6 (#006 Charizard).
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900">
                02. Valid Pokédex Bounds
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                National Pokédex IDs start at #001 (Bulbasaur). When a reading floors to 0, Poke Weather displays an outside-range state instead of forcing an invalid match.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900">
                03. Celsius vs. Fahrenheit
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Toggle between °C and °F at any time. Celsius typically explores starter and early-route Pokémon (#001–#045), while Fahrenheit unlocks mid-to-late Kanto entries (#030–#115).
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
            <PokeballIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold text-slate-900">Negative temperatures.</span>{' '}
              A reading below zero is shown as its absolute value, marked with a Pokéball, and displayed in a negative (inverted) color scheme. For example, -2.3° shows as 2.3° and matches #002 Ivysaur.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Poke Weather</span>
          <div className="flex items-center gap-2">
            <span>
              Weather data by{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="text-slate-700 hover:text-slate-900 underline underline-offset-2"
              >
                Open-Meteo
              </a>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Pokémon data &amp; artwork by{' '}
              <a
                href="https://pokeapi.co/"
                target="_blank"
                rel="noreferrer"
                className="text-slate-700 hover:text-slate-900 underline underline-offset-2"
              >
                PokéAPI
              </a>
            </span>
          </div>
        </div>
      </footer>

      {inspected && weather && (
        <PokemonDetailModal
          pokemon={inspected.pokemon}
          contextLabel={inspected.contextLabel}
          rawTemperature={inspected.rawTemperature}
          temperatureSymbol={weather.temperatureSymbol}
          onClose={() => setInspected(null)}
        />
      )}
    </div>
  );
}

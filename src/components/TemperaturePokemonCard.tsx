import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Snowflake } from 'lucide-react';
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
import type { PokemonLookupResult, PokemonRecord } from '../types/weather';

interface TemperaturePokemonCardProps {
  label: string;
  sublabel: string;
  temperature: number;
  temperatureSymbol: '°C' | '°F';
  lookup: PokemonLookupResult | null;
  isLoading: boolean;
  variant: 'high' | 'low';
  onInspectPokemon: (pokemon: PokemonRecord, contextLabel: string, rawTemp: number) => void;
}

export function TemperaturePokemonCard({
  label,
  sublabel,
  temperature,
  temperatureSymbol,
  lookup,
  isLoading,
  variant,
  onInspectPokemon,
}: TemperaturePokemonCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showShiny, setShowShiny] = useState(false);

  const flooredId = floorTemperatureToPokedexId(temperature);
  const isNegative = isNegativeTemperature(temperature);
  const pokemon = lookup?.status === 'found' ? lookup.pokemon : null;
  const activeArtwork =
    pokemon && (showShiny && pokemon.shinyArtworkUrl ? pokemon.shinyArtworkUrl : pokemon.artworkUrl);

  useEffect(() => {
    setImageError(false);
    setShowShiny(false);
  }, [pokemon?.id]);

  const accentHex = pokemon
    ? getTypeAccentHex(pokemon.types[0])
    : variant === 'high'
      ? '#D94826'
      : '#2563EB';

  return (
    <article
      className={`bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-6 transition-colors ${
        isNegative ? 'negative-scheme' : ''
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            {variant === 'high' ? (
              <ArrowUpRight className="w-4 h-4 text-[#D94826]" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            )}
            <span>{label}</span>
          </div>
          <p className="text-xs text-slate-400">{sublabel}</p>
        </div>

        <div className="text-right">
          {isNegative && (
            <div className="mb-1.5 flex justify-end">
              <NegativeReadingBadge />
            </div>
          )}
          <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatTemperatureMagnitude(temperature)}
            <span className="text-xl text-slate-500 font-normal ml-0.5">
              {temperatureSymbol}
            </span>
          </div>
          <div className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
            Floored to {flooredId}
          </div>
        </div>
      </div>

      {/* Artwork & Pokédex Match Area */}
      <div className="border-t border-slate-100 pt-5 flex items-center gap-5">
        {isLoading ? (
          <>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-slate-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
              <div className="h-6 w-36 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          </>
        ) : pokemon ? (
          <>
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: `radial-gradient(circle at 50% 55%, ${accentHex}14 0%, #F8FAFC 72%)`,
              }}
            >
              {activeArtwork && !imageError ? (
                <img
                  src={activeArtwork}
                  alt={`${pokemon.displayName} official Pokédex artwork (#${pokemon.id})`}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-200 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <span className="font-mono text-lg font-semibold text-slate-400 tabular-nums">
                    {formatPokedexNumber(pokemon.id)}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{pokemon.displayName}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-700 tabular-nums">
                  {formatPokedexNumber(pokemon.id)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{pokemon.types.join(' / ')}</span>
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900 truncate">
                {pokemon.displayName}
              </h3>

              <div className="flex items-center gap-4 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => onInspectPokemon(pokemon, label, temperature)}
                  className="font-medium text-slate-900 hover:text-[#D93829] underline underline-offset-4 decoration-slate-300 hover:decoration-[#D93829] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Inspect Pokédex entry
                </button>
                {pokemon.shinyArtworkUrl && (
                  <button
                    type="button"
                    onClick={() => setShowShiny((prev) => !prev)}
                    className={`font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showShiny
                        ? 'text-[#D93829]'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {showShiny ? 'Show standard' : 'Show shiny'}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-slate-100/80 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <Snowflake className="w-7 h-7 mb-1.5 text-slate-400" aria-hidden="true" />
              <span className="font-mono text-sm font-medium text-slate-500 tabular-nums">
                {formatPokedexNumber(flooredId)}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                No Pokédex match for {flooredId}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Outside Pokédex Range
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {lookup && lookup.status !== 'found'
                  ? lookup.reason
                  : 'National Pokédex entries begin at #001 (Bulbasaur).'}
              </p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

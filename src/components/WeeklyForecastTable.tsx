import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
} from 'lucide-react';
import { describeWmoCode } from '../services/openMeteo';
import {
  floorTemperatureToPokedexId,
  formatPokedexNumber,
} from '../services/pokeApi';
import {
  formatTemperature,
  isNegativeTemperature,
} from '../services/temperature';
import { PokeballIcon } from './PokeballIcon';
import type {
  DailyForecastDay,
  PokemonLookupResult,
  PokemonRecord,
} from '../types/weather';

interface WeeklyForecastTableProps {
  days: DailyForecastDay[];
  temperatureSymbol: '°C' | '°F';
  pokemonMap: Map<number, PokemonLookupResult>;
  isLoadingPokemon: boolean;
  onInspectPokemon: (
    pokemon: PokemonRecord,
    contextLabel: string,
    rawTemp: number
  ) => void;
}

function WeatherConditionGlyph({ code }: { code: number }) {
  const info = describeWmoCode(code);
  switch (info.category) {
    case 'clear':
      return <Sun className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />;
    case 'fog':
      return <CloudFog className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />;
    case 'rain':
      return <CloudRain className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />;
    case 'snow':
      return <CloudSnow className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />;
    case 'storm':
      return <CloudLightning className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />;
    default:
      return <Cloud className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />;
  }
}

function formatDayLabel(isoDate: string, index: number): { primary: string; secondary: string } {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const weekday =
    index === 0
      ? 'Today'
      : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const shortDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return { primary: weekday, secondary: shortDate };
}

interface MiniPokemonCellProps {
  temperature: number;
  temperatureSymbol: '°C' | '°F';
  lookup?: PokemonLookupResult;
  isLoading: boolean;
  contextLabel: string;
  onInspect: (pokemon: PokemonRecord, contextLabel: string, rawTemp: number) => void;
}

function MiniPokemonCell({
  temperature,
  temperatureSymbol,
  lookup,
  isLoading,
  contextLabel,
  onInspect,
}: MiniPokemonCellProps) {
  const floored = floorTemperatureToPokedexId(temperature);
  const isNegative = isNegativeTemperature(temperature);
  const pokemon = lookup?.status === 'found' ? lookup.pokemon : null;

  return (
    <div
      className={`flex items-center justify-end gap-3 ${
        isNegative ? 'negative-scheme rounded-lg px-2 py-1 -mx-2 -my-1' : ''
      }`}
    >
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
          {isNegative && <PokeballIcon className="w-3.5 h-3.5 shrink-0" />}
          <span>
            {formatTemperature(temperature)}
            {temperatureSymbol}
          </span>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap">
          {isLoading && !lookup ? (
            <span className="text-slate-400">Loading…</span>
          ) : pokemon ? (
            <button
              type="button"
              onClick={() => onInspect(pokemon, contextLabel, temperature)}
              className="hover:text-[#D93829] hover:underline underline-offset-2 transition-colors cursor-pointer"
            >
              <span className="font-mono tabular-nums mr-1">
                {formatPokedexNumber(pokemon.id)}
              </span>
              {pokemon.displayName}
            </button>
          ) : (
            <span className="font-mono text-slate-400 tabular-nums">
              No match ({floored})
            </span>
          )}
        </div>
      </div>

      {pokemon && (pokemon.spriteUrl || pokemon.artworkUrl) ? (
        <button
          type="button"
          onClick={() => onInspect(pokemon, contextLabel, temperature)}
          aria-label={`Inspect ${pokemon.displayName} (${formatPokedexNumber(pokemon.id)})`}
          className="w-10 h-10 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <img
            src={pokemon.spriteUrl ?? pokemon.artworkUrl ?? ''}
            alt={pokemon.displayName}
            referrerPolicy="no-referrer"
            className="w-9 h-9 object-contain"
          />
        </button>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-100/70 flex items-center justify-center shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
          —
        </div>
      )}
    </div>
  );
}

export function WeeklyForecastTable({
  days,
  temperatureSymbol,
  pokemonMap,
  isLoadingPokemon,
  onInspectPokemon,
}: WeeklyForecastTableProps) {
  return (
    <section id="forecast" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            7-Day Forecast &amp; Daily Pokémon
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Each day&apos;s low and high temperatures floored to their matching National Pokédex number.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-5 whitespace-nowrap">Day</th>
                <th className="py-3 px-4 whitespace-nowrap">Conditions</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Precip</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Daily Low &amp; Pokémon</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Daily High &amp; Pokémon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((day, idx) => {
                const { primary, secondary } = formatDayLabel(day.date, idx);
                const wmo = describeWmoCode(day.weatherCode);
                const lowId = floorTemperatureToPokedexId(day.tempMin);
                const highId = floorTemperatureToPokedexId(day.tempMax);

                return (
                  <tr
                    key={day.date}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {primary}
                      </div>
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        {secondary}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <WeatherConditionGlyph code={day.weatherCode} />
                        <span>{wmo.label}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-600 tabular-nums whitespace-nowrap">
                      {day.precipitationProbabilityMax !== null
                        ? `${day.precipitationProbabilityMax}%`
                        : '—'}
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <MiniPokemonCell
                        temperature={day.tempMin}
                        temperatureSymbol={temperatureSymbol}
                        lookup={pokemonMap.get(lowId)}
                        isLoading={isLoadingPokemon}
                        contextLabel={`${primary} (${secondary}) Low`}
                        onInspect={onInspectPokemon}
                      />
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <MiniPokemonCell
                        temperature={day.tempMax}
                        temperatureSymbol={temperatureSymbol}
                        lookup={pokemonMap.get(highId)}
                        isLoading={isLoadingPokemon}
                        contextLabel={`${primary} (${secondary}) High`}
                        onInspect={onInspectPokemon}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

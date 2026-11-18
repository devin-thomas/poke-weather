import { useEffect, useRef, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import {
  floorTemperatureToPokedexId,
  formatPokedexNumber,
  getTypeAccentHex,
} from '../services/pokeApi';
import { formatTemperature } from '../services/temperature';
import type { PokemonRecord } from '../types/weather';

interface PokemonDetailModalProps {
  pokemon: PokemonRecord;
  contextLabel: string;
  rawTemperature: number;
  temperatureSymbol: '°C' | '°F';
  onClose: () => void;
}

export function PokemonDetailModal({
  pokemon,
  contextLabel,
  rawTemperature,
  temperatureSymbol,
  onClose,
}: PokemonDetailModalProps) {
  const [showShiny, setShowShiny] = useState(false);
  const [isPlayingCry, setIsPlayingCry] = useState(false);
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const accentHex = getTypeAccentHex(pokemon.types[0]);
  const floored = floorTemperatureToPokedexId(rawTemperature);
  const activeArtwork =
    showShiny && pokemon.shinyArtworkUrl ? pokemon.shinyArtworkUrl : pokemon.artworkUrl;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onClose]);

  const handlePlayCry = () => {
    if (!pokemon.cryUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(pokemon.cryUrl);
    audio.volume = 0.35;
    audioRef.current = audio;
    setIsPlayingCry(true);
    audio.onended = () => setIsPlayingCry(false);
    audio.onerror = () => setIsPlayingCry(false);
    audio.play().catch(() => setIsPlayingCry(false));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pokemon-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl shadow-slate-950/20">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-700 truncate">{contextLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums whitespace-nowrap">
              {formatTemperature(rawTemperature)}
              {temperatureSymbol} → {formatPokedexNumber(floored)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Pokédex detail"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="w-40 h-40 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `radial-gradient(circle at 50% 55%, ${accentHex}18 0%, #F8FAFC 72%)`,
              }}
            >
              {activeArtwork && !imageError ? (
                <img
                  src={activeArtwork}
                  alt={`${pokemon.displayName} official artwork`}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <span className="font-mono text-2xl font-semibold text-slate-400 tabular-nums">
                  {formatPokedexNumber(pokemon.id)}
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {formatPokedexNumber(pokemon.id)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{pokemon.types.join(' / ')}</span>
              </div>

              <h3
                id="pokemon-modal-title"
                className="text-3xl font-bold tracking-tight text-slate-900"
              >
                {pokemon.displayName}
              </h3>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-mono tabular-nums pt-0.5">
                <span>Height {pokemon.heightMeters.toFixed(1)} m</span>
                <span aria-hidden="true">·</span>
                <span>Weight {pokemon.weightKg.toFixed(1)} kg</span>
              </div>

              <div className="text-xs text-slate-600 pt-0.5">
                <span className="text-slate-400 mr-1.5">Abilities:</span>
                <span>{pokemon.abilities.join(', ')}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                {pokemon.shinyArtworkUrl && (
                  <button
                    type="button"
                    onClick={() => setShowShiny((prev) => !prev)}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {showShiny ? 'Standard Artwork' : 'Shiny Artwork'}
                  </button>
                )}
                {pokemon.cryUrl && (
                  <button
                    type="button"
                    onClick={handlePlayCry}
                    disabled={isPlayingCry}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isPlayingCry ? 'Playing…' : 'Play Cry'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Base Stats */}
          <div className="border-t border-slate-100 pt-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Base Stats</span>
              <span className="font-mono tabular-nums">
                Total {pokemon.stats.reduce((sum, s) => sum + s.baseStat, 0)}
              </span>
            </div>
            <div className="space-y-2">
              {pokemon.stats.map((stat) => {
                const widthPct = Math.min(100, Math.round((stat.baseStat / 200) * 100));
                return (
                  <div
                    key={stat.name}
                    className="grid grid-cols-[72px_40px_1fr] items-center gap-3 text-xs"
                  >
                    <span className="text-slate-600">{stat.name}</span>
                    <span className="font-mono font-semibold text-slate-900 text-right tabular-nums">
                      {stat.baseStat}
                    </span>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-transform duration-300 origin-left"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: accentHex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

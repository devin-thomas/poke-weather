import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import {
  PRESET_CITIES,
  formatLocationSubtitle,
  searchCities,
} from '../services/openMeteo';
import type { GeoLocation, TemperatureUnit } from '../types/weather';

interface CitySearchBarProps {
  selectedLocation: GeoLocation;
  unit: TemperatureUnit;
  onSelectLocation: (location: GeoLocation) => void;
  onUnitChange: (unit: TemperatureUnit) => void;
  isLoadingWeather: boolean;
}

export function CitySearchBar({
  selectedLocation,
  unit,
  onSelectLocation,
  onUnitChange,
  isLoadingWeather,
}: CitySearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchCities(trimmed, 6, controller.signal);
        setSuggestions(results);
        setIsOpen(true);
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError('Could not search cities right now. Please try again.');
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const commitLocation = (loc: GeoLocation) => {
    onSelectLocation(loc);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setSearchError(null);
    inputRef.current?.blur();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (suggestions.length > 0) {
      const target =
        activeIndex >= 0 && activeIndex < suggestions.length
          ? suggestions[activeIndex]
          : suggestions[0];
      commitLocation(target);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchCities(trimmed, 6);
      if (results.length > 0) {
        commitLocation(results[0]);
      } else {
        setSuggestions([]);
        setIsOpen(true);
        setSearchError(`No city found matching "${trimmed}". Try a nearby city name.`);
      }
    } catch {
      setSearchError('City lookup failed. Check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <section aria-label="City Search and Units" className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div ref={containerRef} className="relative flex-1">
          <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0 || searchError) {
                    setIsOpen(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search any city (e.g. Kyoto, Denver, Oslo, Nairobi)…"
                aria-label="Search city"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setSearchError(null);
                    setIsOpen(false);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching || isLoadingWeather || query.trim().length === 0}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#D93829] hover:bg-[#BF2E20] active:bg-[#A6271B] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D93829]"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : null}
              <span>Search</span>
            </button>
          </form>

          {isOpen && (suggestions.length > 0 || searchError || (query.trim().length >= 2 && !isSearching)) && (
            <div
              role="listbox"
              className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/8 overflow-hidden z-40"
            >
              {searchError ? (
                <p className="px-4 py-3 text-sm text-slate-600">{searchError}</p>
              ) : suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">
                  No matching cities found for &ldquo;{query.trim()}&rdquo;.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {suggestions.map((loc, index) => {
                    const subtitle = formatLocationSubtitle(loc);
                    const isActive = index === activeIndex;
                    return (
                      <li key={loc.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => commitLocation(loc)}
                          className={`w-full px-4 py-3 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                            isActive ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin
                              className="w-4 h-4 text-slate-400 shrink-0"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {loc.name}
                              </div>
                              {subtitle && (
                                <div className="text-xs text-slate-500 truncate">
                                  {subtitle}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                            {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Temperature Scale Segmented Control */}
        <div
          role="group"
          aria-label="Temperature scale"
          className="inline-flex items-center p-1 bg-slate-200/75 rounded-xl shrink-0 self-start md:self-auto"
        >
          <button
            type="button"
            onClick={() => onUnitChange('celsius')}
            aria-pressed={unit === 'celsius'}
            className={`min-h-[36px] px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D93829] ${
              unit === 'celsius'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Celsius (°C)
          </button>
          <button
            type="button"
            onClick={() => onUnitChange('fahrenheit')}
            aria-pressed={unit === 'fahrenheit'}
            className={`min-h-[36px] px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D93829] ${
              unit === 'fahrenheit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fahrenheit (°F)
          </button>
        </div>
      </div>

      {/* Quick City Switcher */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="text-slate-400">Quick cities:</span>
        {PRESET_CITIES.map((city) => {
          const isCurrent =
            city.id === selectedLocation.id ||
            (city.name === selectedLocation.name &&
              city.country_code === selectedLocation.country_code);
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => onSelectLocation(city)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:underline ${
                isCurrent
                  ? 'text-[#D93829] font-semibold underline underline-offset-4 decoration-[#D93829]/60'
                  : 'text-slate-600 hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300'
              }`}
            >
              {city.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

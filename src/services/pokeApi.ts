import type { PokemonLookupResult, PokemonRecord } from '../types/weather';

const POKEAPI_POKEMON_ENDPOINT = 'https://pokeapi.co/api/v2/pokemon';
const LOCAL_STORAGE_KEY = 'poke_weather_pokeapi_cache_v1';

// In-memory cache & in-flight deduplication to respect PokéAPI Fair Use Policy.
const memoryCache = new Map<number, PokemonRecord>();
const notFoundIds = new Set<number>();
const inFlightRequests = new Map<number, Promise<PokemonLookupResult>>();

let storageHydrated = false;

function hydrateCacheFromStorage(): void {
  if (storageHydrated || typeof window === 'undefined') return;
  storageHydrated = true;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, PokemonRecord>;
    for (const [key, record] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isInteger(id) && id >= 1 && record && typeof record.name === 'string') {
        memoryCache.set(id, record);
      }
    }
  } catch {
    // Ignore corrupted storage entries.
  }
}

function persistCacheToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(memoryCache.entries()).slice(-150);
    const serialized: Record<string, PokemonRecord> = {};
    for (const [id, record] of entries) {
      serialized[String(id)] = record;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore storage quota errors.
  }
}

/**
 * Converts a temperature reading to a Pokédex number: take the absolute value, then floor it
 * (discarding decimals). Negative readings are shown as their magnitude.
 * Example: 9.8 -> 9, 0.7 -> 0, -2.3 -> 2, -9.8 -> 9.
 */
export function floorTemperatureToPokedexId(temperature: number): number {
  return Math.floor(Math.abs(temperature));
}

/**
 * Formats a National Pokédex ID with leading zeros (e.g. 9 -> #009, 1025 -> #1025).
 */
export function formatPokedexNumber(id: number): string {
  if (id <= 0) {
    return `#${id}`;
  }
  return `#${String(id).padStart(3, '0')}`;
}

const SPECIAL_NAME_MAP: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'farfetchd': "Farfetch'd",
  'mr-mime': 'Mr. Mime',
  'ho-oh': 'Ho-Oh',
  'mime-jr': 'Mime Jr.',
  'porygon-z': 'Porygon-Z',
  'flabebe': 'Flabébé',
  'type-null': 'Type: Null',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  'tapu-koko': 'Tapu Koko',
  'tapu-lele': 'Tapu Lele',
  'tapu-bulu': 'Tapu Bulu',
  'tapu-fini': 'Tapu Fini',
  'sirfetchd': "Sirfetch'd",
  'mr-rime': 'Mr. Rime',
};

export function formatPokemonName(apiName: string): string {
  const lower = apiName.toLowerCase();
  if (SPECIAL_NAME_MAP[lower]) {
    return SPECIAL_NAME_MAP[lower];
  }
  return lower
    .split('-')
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function formatStatName(apiStatName: string): string {
  switch (apiStatName) {
    case 'hp':
      return 'HP';
    case 'attack':
      return 'Attack';
    case 'defense':
      return 'Defense';
    case 'special-attack':
      return 'Sp. Atk';
    case 'special-defense':
      return 'Sp. Def';
    case 'speed':
      return 'Speed';
    default:
      return formatPokemonName(apiStatName);
  }
}

interface PokeApiRawPokemon {
  id: number;
  name: string;
  height: number; // decimeters
  weight: number; // hectograms
  types: Array<{ slot: number; type: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
  cries?: {
    latest?: string | null;
    legacy?: string | null;
  };
}

/**
 * Looks up a Pokémon by its National Pokédex integer via PokéAPI v2 (/api/v2/pokemon/{id}).
 * Returns an explicit out-of-range result when the floored temperature is <= 0 or not in PokéAPI.
 */
export async function fetchPokemonByNumber(
  pokedexNumber: number
): Promise<PokemonLookupResult> {
  hydrateCacheFromStorage();

  if (!Number.isInteger(pokedexNumber) || pokedexNumber < 1) {
    return {
      status: 'out-of-range',
      pokedexNumber,
      reason:
        pokedexNumber === 0
          ? 'National Pokédex numbering begins at #001 (Bulbasaur), so 0° has no matching Pokémon.'
          : `Negative numbers like ${pokedexNumber}° fall below #001 (Bulbasaur) and have no Pokédex entry.`,
    };
  }

  const cached = memoryCache.get(pokedexNumber);
  if (cached) {
    return { status: 'found', pokedexNumber, pokemon: cached };
  }

  if (notFoundIds.has(pokedexNumber)) {
    return {
      status: 'out-of-range',
      pokedexNumber,
      reason: `PokéAPI has no Pokémon registered at #${pokedexNumber}.`,
    };
  }

  const existingPromise = inFlightRequests.get(pokedexNumber);
  if (existingPromise) {
    return existingPromise;
  }

  const requestPromise: Promise<PokemonLookupResult> = (async () => {
    try {
      const response = await fetch(`${POKEAPI_POKEMON_ENDPOINT}/${pokedexNumber}`);

      if (response.status === 404) {
        notFoundIds.add(pokedexNumber);
        return {
          status: 'out-of-range',
          pokedexNumber,
          reason: `PokéAPI has no Pokémon registered at #${pokedexNumber}.`,
        };
      }

      if (!response.ok) {
        return {
          status: 'error',
          pokedexNumber,
          reason: `PokéAPI returned status ${response.status} for #${pokedexNumber}.`,
        };
      }

      const raw = (await response.json()) as PokeApiRawPokemon;
      const officialArtwork = raw.sprites.other?.['official-artwork'];

      const record: PokemonRecord = {
        id: raw.id,
        name: raw.name,
        displayName: formatPokemonName(raw.name),
        types: raw.types
          .sort((a, b) => a.slot - b.slot)
          .map((t) => formatPokemonName(t.type.name)),
        artworkUrl: officialArtwork?.front_default ?? raw.sprites.front_default ?? null,
        shinyArtworkUrl: officialArtwork?.front_shiny ?? null,
        spriteUrl: raw.sprites.front_default ?? officialArtwork?.front_default ?? null,
        heightMeters: raw.height / 10,
        weightKg: raw.weight / 10,
        abilities: raw.abilities.map((a) => formatPokemonName(a.ability.name)),
        stats: raw.stats.map((s) => ({
          name: formatStatName(s.stat.name),
          baseStat: s.base_stat,
        })),
        cryUrl: raw.cries?.latest ?? raw.cries?.legacy ?? null,
      };

      memoryCache.set(pokedexNumber, record);
      persistCacheToStorage();

      return { status: 'found', pokedexNumber, pokemon: record };
    } catch {
      return {
        status: 'error',
        pokedexNumber,
        reason: `Unable to reach PokéAPI for #${pokedexNumber}.`,
      };
    } finally {
      inFlightRequests.delete(pokedexNumber);
    }
  })();

  inFlightRequests.set(pokedexNumber, requestPromise);
  return requestPromise;
}

/**
 * Fetches multiple unique Pokédex numbers in parallel and returns a lookup Map.
 */
export async function fetchPokemonBatch(
  pokedexNumbers: number[]
): Promise<Map<number, PokemonLookupResult>> {
  const uniqueIds = Array.from(new Set(pokedexNumbers));
  const results = await Promise.all(
    uniqueIds.map(async (id) => [id, await fetchPokemonByNumber(id)] as const)
  );
  return new Map(results);
}

/**
 * Subtle editorial accent color per Pokémon primary type (used strictly for restrained hairline/bar accents).
 */
export function getTypeAccentHex(typeName?: string): string {
  const key = (typeName ?? '').toLowerCase();
  const palette: Record<string, string> = {
    fire: '#D94826',
    water: '#2563EB',
    grass: '#15803D',
    electric: '#CA8A04',
    ice: '#0284C7',
    fighting: '#B91C1C',
    poison: '#7E22CE',
    ground: '#A16207',
    flying: '#4F46E5',
    psychic: '#DB2777',
    bug: '#4D7C0F',
    rock: '#78716C',
    ghost: '#5B21B6',
    dragon: '#4338CA',
    dark: '#334155',
    steel: '#475569',
    fairy: '#BE185D',
    normal: '#52525B',
  };
  return palette[key] ?? '#334155';
}

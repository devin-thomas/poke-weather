# Poke Weather

Live city weather from [Open-Meteo](https://open-meteo.com/), matched to Pokémon by National Pokédex number using [PokéAPI](https://pokeapi.co/).

Each temperature is floored to a whole number, and that number is used as a Pokédex ID. For example, 9.8° shows #009 Blastoise and 6.4° shows #006 Charizard.

**Negative temperatures get special treatment.** A negative reading keeps its minus sign, is marked with a Pokéball, and is given an inverted (negative) color scheme. Its Pokédex number is based on the absolute value, so -2.3° shows as −2.3° and matches #002 Ivysaur.

No API keys are required. Both data sources are public.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Cloudflare Workers

```bash
npx wrangler login
npm run deploy
```

The app is static. Wrangler serves `dist/` as Worker static assets (see `wrangler.jsonc`).

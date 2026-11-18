# Poke Weather

Live city weather from [Open-Meteo](https://open-meteo.com/), matched to Pokémon by National Pokédex number using [PokéAPI](https://pokeapi.co/).

Each temperature is floored to a whole number, and that number is used as a Pokédex ID. For example, 9.8° shows #009 Blastoise and 6.4° shows #006 Charizard.

**Negative temperatures get special treatment.** A negative reading is shown as its absolute value, marked with a Pokéball, and given an inverted (negative) color scheme. For example, -2.3° shows as 2.3° in negative colors and matches #002 Ivysaur.

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

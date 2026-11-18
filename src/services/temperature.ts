/**
 * True when a reading is below zero. Negative readings get the Pokéball treatment
 * and the inverted color scheme.
 */
export function isNegativeTemperature(temperature: number): boolean {
  return temperature < 0;
}

/**
 * Formats a reading for display with one decimal place, keeping the minus sign.
 * Example: -2.34 -> "−2.3", 9.8 -> "9.8".
 * The Pokédex index is still derived from the absolute value (see floorTemperatureToPokedexId).
 */
export function formatTemperature(temperature: number): string {
  const magnitude = Math.abs(temperature).toFixed(1);
  return isNegativeTemperature(temperature) ? `−${magnitude}` : magnitude;
}

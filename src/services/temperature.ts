/**
 * True when a reading is below zero. Negative readings get the Pokéball treatment
 * and the inverted color scheme.
 */
export function isNegativeTemperature(temperature: number): boolean {
  return temperature < 0;
}

/**
 * Absolute value of a reading, formatted to one decimal place (e.g. -2.34 -> "2.3").
 * The sign is dropped on purpose: negative readings are displayed as their magnitude.
 */
export function formatTemperatureMagnitude(temperature: number): string {
  return Math.abs(temperature).toFixed(1);
}

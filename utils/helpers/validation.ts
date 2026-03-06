/**
 * Regular expression patterns for validation
 */
export const INTEGER_TOKEN_RE = /^-?\d+$/
export const NUMBER_TOKEN_RE = /^-?\d+(\.\d+)?$/
export const HEX_COLOR_RE = /^#[\da-fA-F]{6}$/

/**
 * Validates if a string is a valid integer
 */
export function isValidInteger(value: string): boolean {
  return INTEGER_TOKEN_RE.test(value)
}

/**
 * Validates if a string is a valid number
 */
export function isValidNumber(value: string): boolean {
  return NUMBER_TOKEN_RE.test(value)
}

/**
 * Validates if a string is a valid hex color (6 digits, with #)
 */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value)
}

/**
 * Parses a number from a string, returning null if invalid
 */
export function parseNumber(value: string): number | null {
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Parses an integer from a string, returning null if invalid
 */
export function parseInteger(value: string): number | null {
  const num = parseInt(value, 10)
  return isNaN(num) ? null : num
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

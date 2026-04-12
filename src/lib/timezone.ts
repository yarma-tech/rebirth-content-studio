import { fromZonedTime, toZonedTime } from "date-fns-tz"

export const MONTREAL_TZ = "America/Montreal"

/**
 * Convert a naive datetime string (from date picker, no timezone)
 * to a UTC ISO string, interpreting the input as Montreal time.
 *
 * "2026-04-12T14:30" → "2026-04-12T18:30:00.000Z" (EDT = UTC-4)
 */
export function montrealToUtc(naiveDatetime: string): string {
  return fromZonedTime(naiveDatetime, MONTREAL_TZ).toISOString()
}

/**
 * Convert a UTC ISO string from the database to a Date object
 * adjusted to Montreal timezone for display.
 *
 * "2026-04-12T18:30:00.000Z" → Date representing 14:30 Montreal
 */
export function utcToMontreal(utcString: string): Date {
  return toZonedTime(utcString, MONTREAL_TZ)
}

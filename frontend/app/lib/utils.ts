import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "45 seconds", "1 minute", "3 hours" — rounded up so we never promise too early. */
export function waitText(seconds: number): string {
  const [count, unit] = seconds < 60
    ? [Math.max(1, Math.ceil(seconds)), 'second']
    : seconds < 3600
      ? [Math.ceil(seconds / 60), 'minute']
      : [Math.ceil(seconds / 3600), 'hour']
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

/** `Retry-After` is either delta-seconds or an HTTP date; returns whole seconds, or undefined. */
export function parseRetryAfter(header: string | null | undefined, now = Date.now()): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return seconds > 0 ? Math.ceil(seconds) : undefined
  const at = Date.parse(header)
  return Number.isNaN(at) || at <= now ? undefined : Math.ceil((at - now) / 1000)
}

/**
 * Strip HTML tags to plain text and decode the handful of entities our
 * sanitized AI replies can contain. SSR-safe (no DOM access), so it's usable
 * in computeds that may run during server render.
 *
 * Use for surfaces that must NOT render markup — e.g. the voice call caption
 * and transcript. (Chat bubbles intentionally render the reply as HTML.)
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3?9;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

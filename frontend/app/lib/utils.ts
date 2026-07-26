import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

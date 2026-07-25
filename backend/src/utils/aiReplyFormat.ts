import sanitizeHtml from "sanitize-html";

// Single source of truth for the AI reply tag allowlist — interpolated into the
// system prompt (providers/prompt.ts) and enforced by the sanitizer below, so
// the two can never drift. Frontend styling (.html-content) must cover this set.
export const AI_REPLY_ALLOWED_TAGS = ["p", "strong", "em", "ul", "ol", "li", "br"];

// Shown instead of a reply that sanitizes down to nothing (e.g. the model
// returned only disallowed tags) — never store a blank assistant message.
const EMPTY_REPLY_FALLBACK =
  "<p>Sorry — I had trouble writing that reply. Please send your message again.</p>";

// sanitize-html re-escapes text nodes (& → &amp;), which is correct for HTML
// storage but wrong for plain-text consumers (TTS would speak "amp"). Decode
// &amp; last so double-encoded input can't round-trip into live markup.
function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

// The LLM's JSON is parsed with no schema validation and `reply` is rendered
// client-side via v-html — allowlist-sanitize before it ever reaches the DB or
// a response so a stray/injected tag can't become stored XSS. Also normalizes:
// a plain-prose reply (model regression, heuristic fallback) is wrapped in <p>
// so it renders correctly under v-html instead of collapsing onto one line.
export function sanitizeAiReply(reply: string): string {
  const sanitized = sanitizeHtml(reply, {
    allowedTags: AI_REPLY_ALLOWED_TAGS,
    allowedAttributes: {},
  }).trim();

  if (!sanitized) return EMPTY_REPLY_FALLBACK;

  // No block container → treat as prose: paragraphs on blank lines, <br> within
  if (!/<(p|ul|ol)[\s>]/i.test(sanitized)) {
    return sanitized
      .split(/\n{2,}/)
      .map((part) => `<p>${part.trim().replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  return sanitized;
}

// HTML → plain text: for TTS input, evaluation fields, and word counts.
// Block boundaries (</p>, </li>, <br>) become a space first so list items and
// paragraphs don't run together into one unbroken sentence; entities are
// decoded so "&amp;" is spoken/counted as "&", not "amp".
export function htmlToPlainText(html: string): string {
  const withBreaks = html.replace(/<\/(p|li)>|<br\s*\/?>/gi, " ");
  return decodeEntities(sanitizeHtml(withBreaks, { allowedTags: [] }))
    .replace(/\s+/g, " ")
    .trim();
}

// Word count on the visible words of a (possibly HTML) reply — tags and
// entities never count as words.
export function countAiReplyWords(reply: string): number {
  return htmlToPlainText(reply).split(/\s+/).filter(Boolean).length;
}

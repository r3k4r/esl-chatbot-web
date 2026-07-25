import { describe, it, expect } from "bun:test";
import {
  AI_REPLY_ALLOWED_TAGS,
  sanitizeAiReply,
  htmlToPlainText,
  countAiReplyWords,
} from "../aiReplyFormat.ts";

// These are pure functions — no DB, no network. They guard the v-html contract:
// the sanitizer is the only thing standing between unvalidated LLM output and
// the frontend's v-html render, so regressions here are stored XSS.

describe("sanitizeAiReply", () => {
  it("passes through the full allowed tag set (only <br> is normalized to <br />)", () => {
    const html =
      "<p>Great job! Try these:</p><ul><li>eat <strong>an</strong> apple</li><li>drink <em>some</em> water</li></ul><p>Line<br>break</p><ol><li>first</li></ol>";
    expect(sanitizeAiReply(html)).toBe(html.replace("<br>", "<br />"));
  });

  it("strips script tags including their content", () => {
    expect(sanitizeAiReply("<p>Nice</p><script>alert(1)</script>")).toBe("<p>Nice</p>");
  });

  it("strips event-handler attributes and disallowed tags, keeping inner text", () => {
    const out = sanitizeAiReply('<a href="javascript:alert(1)">click</a><p onclick="evil()">hi</p>');
    expect(out).toBe("click<p>hi</p>");
  });

  it("strips img/iframe/style entirely", () => {
    expect(sanitizeAiReply('<p>ok</p><img src=x onerror=alert(2)><iframe src="x"></iframe>')).toBe("<p>ok</p>");
  });

  it("entity-encodes special characters in text nodes", () => {
    expect(sanitizeAiReply("<p>Tom & Jerry say 5 < 10</p>")).toBe("<p>Tom &amp; Jerry say 5 &lt; 10</p>");
  });

  it("wraps a plain-prose reply in <p> (heuristic fallback / model regression)", () => {
    expect(sanitizeAiReply("Good effort! Keep practicing.")).toBe("<p>Good effort! Keep practicing.</p>");
  });

  it("converts blank-line paragraphs and single newlines of a prose reply", () => {
    expect(sanitizeAiReply("First para.\n\nSecond para.\nSame para.")).toBe(
      "<p>First para.</p><p>Second para.<br>Same para.</p>",
    );
  });

  it("returns a friendly fallback instead of an empty reply", () => {
    const out = sanitizeAiReply("<script>alert(1)</script>");
    expect(out.startsWith("<p>")).toBe(true);
    expect(htmlToPlainText(out).length).toBeGreaterThan(0);
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and keeps block boundaries as spaces", () => {
    expect(
      htmlToPlainText("<p>Great job! Try these:</p><ul><li>eat an apple</li><li>drink water</li></ul>"),
    ).toBe("Great job! Try these: eat an apple drink water");
  });

  it("decodes entities so TTS never speaks 'amp' or 'l t'", () => {
    // Exactly what the stored (sanitized) reply looks like on the voice path
    const stored = sanitizeAiReply("<p>Tom & Jerry say 5 < 10</p>");
    expect(htmlToPlainText(stored)).toBe("Tom & Jerry say 5 < 10");
  });

  it("handles <br> variants and collapses whitespace", () => {
    expect(htmlToPlainText("<p>a<br/>b<br />c</p>")).toBe("a b c");
  });

  it("is a no-op on plain text", () => {
    expect(htmlToPlainText("plain text, no tags at all.")).toBe("plain text, no tags at all.");
  });
});

describe("countAiReplyWords", () => {
  it("counts visible words only, never tags", () => {
    expect(
      countAiReplyWords("<p>Great job!</p><ul><li>eat an apple</li><li>drink water</li></ul>"),
    ).toBe(7);
  });

  it("matches the plain-text count for a prose reply", () => {
    expect(countAiReplyWords("one two three")).toBe(3);
  });

  it("returns 0 for a tag-only string", () => {
    expect(countAiReplyWords("<p></p><ul></ul>")).toBe(0);
  });
});

describe("AI_REPLY_ALLOWED_TAGS", () => {
  it("is the 7-tag contract shared with the prompt", () => {
    expect(AI_REPLY_ALLOWED_TAGS.sort()).toEqual(["br", "em", "li", "ol", "p", "strong", "ul"]);
  });
});

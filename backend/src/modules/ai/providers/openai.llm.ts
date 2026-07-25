import OpenAI from "openai";
import { env } from "../../../config/env.ts";
import { buildSystemPrompt } from "./prompt.ts";
import type { AIResponse, ConversationMessage, LearnerContext } from "../ai.types.ts";

// PREMIUM tier only — GPT-5 mini
// To upgrade to full GPT-5: change model string here (same OPENAI_API_KEY)
const PREMIUM_MODEL = "gpt-5-mini";

export async function callOpenAILLM(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  learner: LearnerContext | null,
): Promise<AIResponse> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(learner) },
    ...conversationHistory.map((m) => ({
      role: (m.role === "USER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // TODO: add prompt caching for system message (75–90% token discount on repeated calls)
  // gpt-5-mini is a REASONING model, so the classic chat params don't apply:
  //   • `temperature`/`top_p` are rejected (400) — omit them entirely.
  //   • use `max_completion_tokens`, NOT `max_tokens` (400 otherwise).
  //   • reasoning tokens are spent from that budget BEFORE any visible output, so
  //     the cap must be generous or the JSON reply comes back empty/truncated.
  //   • `reasoning_effort: "low"` keeps spend + latency down for this structured
  //     tutoring task (scoring a sentence and replying needs no deep reasoning).
  const completion = await client.chat.completions.create({
    model: PREMIUM_MODEL,
    messages,
    response_format: { type: "json_object" },
    reasoning_effort: "low",
    max_completion_tokens: 4000,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty response");
  }

  let parsed: AIResponse;
  try {
    parsed = JSON.parse(raw) as AIResponse;
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${raw.slice(0, 200)}`);
  }

  if (!parsed.reply || !parsed.evaluation) {
    throw new Error("OpenAI response missing required fields");
  }

  return parsed;
}

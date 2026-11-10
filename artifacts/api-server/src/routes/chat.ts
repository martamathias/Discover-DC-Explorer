import { GoogleGenAI, type Content } from "@google/genai";
import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { systemPrompt } from "../city";

const router: IRouter = Router();

const defaults = {
  temperature: 1,
  topP: 0.95,
  maxOutputTokens: 300,
};

const defaultModel = "gemini-2.5-flash";

type ChatSettings = typeof defaults;
type HistoryMessage = { role: "user" | "assistant"; content: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSettings(value: unknown): ChatSettings | null {
  if (value === undefined) {
    return defaults;
  }
  if (!isRecord(value)) {
    return null;
  }

  const temperature = value.temperature ?? defaults.temperature;
  const topP = value.topP ?? defaults.topP;
  const maxOutputTokens = value.maxOutputTokens ?? defaults.maxOutputTokens;

  if (
    typeof temperature !== "number" ||
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 2 ||
    typeof topP !== "number" ||
    !Number.isFinite(topP) ||
    topP < 0 ||
    topP > 1 ||
    typeof maxOutputTokens !== "number" ||
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 32 ||
    maxOutputTokens > 1024
  ) {
    return null;
  }

  return { temperature, topP, maxOutputTokens };
}

function parseHistory(value: unknown): HistoryMessage[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > 40) {
    return null;
  }

  const messages: HistoryMessage[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.length > 4000
    ) {
      return null;
    }
    messages.push({ role: item.role, content: item.content });
  }
  return messages;
}

router.get("/chat/system-prompt", (_req, res) => {
  res.json({ systemPrompt });
});

router.post("/chat", async (req, res) => {
  const body: unknown = req.body;
  if (
    !isRecord(body) ||
    typeof body.message !== "string" ||
    body.message.trim().length === 0 ||
    body.message.length > 4000
  ) {
    res.status(400).json({ error: "Message must be a non-empty string of at most 4000 characters." });
    return;
  }

  const settings = parseSettings(body.settings);
  const history = parseHistory(body.history);
  if (!settings || !history) {
    res.status(400).json({ error: "Invalid chat settings or conversation history." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: "Add a GEMINI_API_KEY secret to enable the AI city guide." });
    return;
  }

  const contents: Content[] = [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })),
    { role: "user", parts: [{ text: body.message.trim() }] },
  ];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL?.trim() || defaultModel;
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: settings.temperature,
        topP: settings.topP,
        maxOutputTokens: settings.maxOutputTokens,
      },
    });
    const reply = response.text?.trim();
    if (!reply) {
      logger.error({ model }, "Gemini returned an empty chat response");
      res.status(502).json({ error: "The city guide returned an empty response. Please try again." });
      return;
    }

    const candidate = response.candidates?.[0];
    const usage = response.usageMetadata;
    res.json({
      reply,
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        truncated: candidate?.finishReason === "MAX_TOKENS",
      },
      settings,
      model,
    });
  } catch (error) {
    logger.error({ err: error }, "Gemini chat request failed");
    res.status(502).json({ error: "The city guide is unavailable right now. Please try again." });
  }
});

export default router;

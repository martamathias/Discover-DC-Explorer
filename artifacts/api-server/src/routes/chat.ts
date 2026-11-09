import { FinishReason, GoogleGenAI } from "@google/genai";
import {
  GetChatSystemPromptResponse,
  PostChatBody,
  PostChatResponse,
} from "@workspace/api-zod";
import { Router, type IRouter } from "express";
import { getCitySystemPrompt, getCitySystemPromptWordCount } from "../city";

const router: IRouter = Router();
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
const DEFAULT_SETTINGS = {
  temperature: 1,
  topP: 0.95,
  maxOutputTokens: 300,
} as const;

router.get("/chat/system-prompt", (_req, res): void => {
  res.json(
    GetChatSystemPromptResponse.parse({
      systemPrompt: getCitySystemPrompt(),
      wordCount: getCitySystemPromptWordCount(),
    }),
  );
});

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = PostChatBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.message.trim()) {
    res.status(400).json({ error: "Enter a question for the city guide." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: "Add a GEMINI_API_KEY secret" });
    return;
  }

  const settings = {
    temperature: parsed.data.settings?.temperature ?? DEFAULT_SETTINGS.temperature,
    topP: parsed.data.settings?.topP ?? DEFAULT_SETTINGS.topP,
    maxOutputTokens:
      parsed.data.settings?.maxOutputTokens ?? DEFAULT_SETTINGS.maxOutputTokens,
  };
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const contents = [
    ...(parsed.data.history ?? []).map((item) => ({
      role: item.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: item.content }],
    })),
    { role: "user" as const, parts: [{ text: parsed.data.message.trim() }] },
  ];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: getCitySystemPrompt(),
        temperature: settings.temperature,
        topP: settings.topP,
        maxOutputTokens: settings.maxOutputTokens,
      },
    });
    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      replyTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    };
    const truncated =
      response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS;

    res.json(
      PostChatResponse.parse({
        reply:
          response.text?.trim() ||
          "I don't have a clear answer yet. Try asking about Washington, DC landmarks, food, neighborhoods, or travel tips.",
        usage,
        settings,
        model,
        truncated,
      }),
    );
  } catch {
    req.log.error("Gemini chat request failed");
    res.status(502).json({
      error: "The city guide is unavailable right now. Please try again.",
    });
  }
});

export default router;

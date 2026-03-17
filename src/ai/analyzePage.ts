import type { PageAnalysis, PageMetrics } from "@/core/types";
import { PageAnalysisSchema } from "@/validation/schemas";
// import { anthropic, AI_MODEL, AI_TEMPERATURE } from "./client";
import { gemini, AI_MODEL, AI_TEMPERATURE } from "./client";
import { logPromptExchange } from "@/logging/logger";

const ANALYSIS_SYSTEM_PROMPT = `You are a senior SEO and UX analyst. You will receive structured page metrics and content in TOON format.

Your task is to produce a detailed, evidence-based analysis of the page in JSON format.

STRICT RULES:
- You MUST reference the exact metric values provided (e.g., "with only 1 H1 heading", "the 450 word count is below average")
- If a claim cannot be directly supported by a provided metric, DO NOT include it.
- If insufficient data exists, explicitly state: "insufficient data"
- Do NOT hallucinate information not present in the TOON input
- Every field must be specific to this page's metrics
- Do not include trailing commas
- Do not include explanations outside JSON
- All fields must be present even if value is "insufficient data"

Use these general benchmarks:
- word_count < 500 → thin content
- images_missing_alt_pct > 30% → poor accessibility
- cta_count < 2 → weak conversion signals
- h1_count ≠ 1 → SEO issue

Return ONLY valid JSON matching this exact schema:
{
  "seoStructure": "string — analysis of heading hierarchy, meta title/description, SEO signals referencing specific metric values",
  "messagingClarity": "string — assessment of content clarity based on word count, headings, and body text excerpt",
  "ctaUsage": "string — evaluation of CTA count and placement effectiveness based on the cta_count metric",
  "contentDepth": "string — analysis of content depth based on word_count, heading counts, and body text excerpt",
  "uxConcerns": "string — structural or UX issues based on link counts, image accessibility metrics, and content structure"
}`;

/**
 * analyzePage — AI Step 1.
 * Accepts a TOON-encoded string (never raw HTML).
 * Validates output with Zod. Retries once on validation failure.
 */
export async function analyzePage(
  toon: string,
  metrics: PageMetrics,
  requestUrl: string,
): Promise<PageAnalysis> {
  const userPrompt = `Analyze the following page data and return your analysis as JSON:\n\n${toon}`;

  const callClaude = async (): Promise<string> => {
    // const response = await anthropic.messages.create({
    //   model: AI_MODEL,
    //   max_tokens: 1500,
    //   temperature: AI_TEMPERATURE,
    //   system: ANALYSIS_SYSTEM_PROMPT,
    //   messages: [{ role: "user", content: userPrompt }],
    // });
    //
    // const block = response.content[0];
    // if (block.type !== "text") {
    //   throw new Error("Claude returned a non-text block for analysis step");
    // }
    // return block.text;

    const model = gemini.getGenerativeModel({
      model: AI_MODEL,
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: AI_TEMPERATURE,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    if (!text) {
      throw new Error("Gemini returned no text for analysis step");
    }
    return text;
  };

  let rawOutput: string;

  // Attempt 1
  rawOutput = await callClaude();

  // Log prompt + response
  logPromptExchange({
    timestamp: new Date().toISOString(),
    requestUrl,
    step: "analysis",
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    userPrompt,
    structuredInput: metrics,
    rawOutput,
  });

  // Parse and validate
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    // Retry once — Claude may have wrapped JSON in markdown code fences
    const stripped = rawOutput.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    try {
      parsed = JSON.parse(stripped);
    } catch {
      // Retry the whole call
      rawOutput = await callClaude();
      logPromptExchange({
        timestamp: new Date().toISOString(),
        requestUrl,
        step: "analysis",
        systemPrompt: ANALYSIS_SYSTEM_PROMPT,
        userPrompt,
        structuredInput: { retry: true, metrics },
        rawOutput,
      });
      const stripped2 = rawOutput.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(stripped2);
    }
  }

  const result = PageAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    // Retry once on validation failure
    rawOutput = await callClaude();
    logPromptExchange({
      timestamp: new Date().toISOString(),
      requestUrl,
      step: "analysis",
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      structuredInput: { retry: true, validationError: result.error.issues, metrics },
      rawOutput,
    });
    const stripped = rawOutput.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    const retryParsed = JSON.parse(stripped);
    const retryResult = PageAnalysisSchema.safeParse(retryParsed);
    if (!retryResult.success) {
      throw new Error(
        `AI analysis failed validation after retry: ${JSON.stringify(retryResult.error.issues)}`,
      );
    }
    return retryResult.data;
  }

  return result.data;
}

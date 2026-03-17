import type { PageAnalysis, PageMetrics, Recommendation } from "@/core/types";
import { RecommendationsSchema } from "@/validation/schemas";
// import { anthropic, AI_MODEL, AI_TEMPERATURE } from "./client";
import { gemini, AI_MODEL, AI_TEMPERATURE } from "./client";
import { logPromptExchange } from "@/logging/logger";

const RECOMMENDATIONS_SYSTEM_PROMPT = `You are a conversion rate and SEO specialist. You have been given a structured page analysis and factual page metrics.

Your task is to produce 3 to 5 prioritized, actionable recommendations in JSON format.

STRICT RULES:
- Each recommendation MUST cite a specific metric from the provided data (e.g., "word_count: 320", "images_missing_alt_pct: 75%")
- Priority must be one of: "high", "medium", or "low"
- Recommendations must be concise and immediately actionable
- Recommendations must include a measurable target when applicable
- Do NOT pad with generic best practices not grounded in the metrics
- Do NOT hallucinate issues not supported by the metrics or analysis
- Do not include trailing commas
- Do not include explanations outside JSON
- All fields must be present even if value is "insufficient data"

Assign priority based on impact:
- high → directly affects SEO ranking or conversions
- medium → improves clarity or engagement
- low → minor optimizations

Return ONLY valid JSON as an array:
[
  {
    "priority": "high" | "medium" | "low",
    "recommendation": "Specific, actionable improvement",
    "reasoning": "Why this matters based on the page's specific data",
    "metricReference": "The exact metric(s) that justify this recommendation"
  }
]`;

/**
 * generateRecommendations — AI Step 2.
 * Takes the step 1 analysis + original metrics (never raw HTML).
 * Validates output with Zod. Retries once on validation failure.
 */
export async function generateRecommendations(
  analysis: PageAnalysis,
  metrics: PageMetrics,
  requestUrl: string,
): Promise<Recommendation[]> {
  const metricsBlock = JSON.stringify(metrics, null, 2);
  const analysisBlock = JSON.stringify(analysis, null, 2);

  const userPrompt = `Based on the following page analysis and metrics, generate 3–5 prioritized recommendations as a JSON array.

## PAGE METRICS (factual)
${metricsBlock}

## PAGE ANALYSIS (step 1 output)
${analysisBlock}

Return ONLY a JSON array of recommendation objects.`;

  const callClaude = async (): Promise<string> => {
    // const response = await anthropic.messages.create({
    //   model: AI_MODEL,
    //   max_tokens: 1200,
    //   temperature: AI_TEMPERATURE,
    //   system: RECOMMENDATIONS_SYSTEM_PROMPT,
    //   messages: [{ role: "user", content: userPrompt }],
    // });
    //
    // const block = response.content[0];
    // if (block.type !== "text") {
    //   throw new Error("Claude returned a non-text block for recommendations step");
    // }
    // return block.text;

    const model = gemini.getGenerativeModel({
      model: AI_MODEL,
      systemInstruction: RECOMMENDATIONS_SYSTEM_PROMPT,
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
      throw new Error("Gemini returned no text for recommendations step");
    }
    return text;
  };

  const stripAndParse = (raw: string): unknown => {
    const stripped = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(stripped);
  };

  let rawOutput: string;

  // Attempt 1
  rawOutput = await callClaude();

  logPromptExchange({
    timestamp: new Date().toISOString(),
    requestUrl,
    step: "recommendations",
    systemPrompt: RECOMMENDATIONS_SYSTEM_PROMPT,
    userPrompt,
    structuredInput: { metrics, analysis },
    rawOutput,
  });

  let parsed: unknown;
  try {
    parsed = stripAndParse(rawOutput);
  } catch {
    // Retry on JSON parse failure
    rawOutput = await callClaude();
    logPromptExchange({
      timestamp: new Date().toISOString(),
      requestUrl,
      step: "recommendations",
      systemPrompt: RECOMMENDATIONS_SYSTEM_PROMPT,
      userPrompt,
      structuredInput: { retry: true, metrics, analysis },
      rawOutput,
    });
    parsed = stripAndParse(rawOutput);
  }

  const result = RecommendationsSchema.safeParse(parsed);
  if (!result.success) {
    // Retry once on schema validation failure
    rawOutput = await callClaude();
    logPromptExchange({
      timestamp: new Date().toISOString(),
      requestUrl,
      step: "recommendations",
      systemPrompt: RECOMMENDATIONS_SYSTEM_PROMPT,
      userPrompt,
      structuredInput: { retry: true, validationError: result.error.issues, metrics, analysis },
      rawOutput,
    });
    const retryParsed = stripAndParse(rawOutput);
    const retryResult = RecommendationsSchema.safeParse(retryParsed);
    if (!retryResult.success) {
      throw new Error(
        `AI recommendations failed validation after retry: ${JSON.stringify(retryResult.error.issues)}`,
      );
    }
    return retryResult.data;
  }

  return result.data;
}

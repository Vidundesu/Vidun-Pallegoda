// import Anthropic from "@anthropic-ai/sdk";

// if (!process.env.ANTHROPIC_API_KEY) {
//   throw new Error(
//     "ANTHROPIC_API_KEY is not set. Add it to your .env.local file.",
//   );
// }

// /**
//  * Singleton Anthropic client.
//  * Initialized once at module load; shared across all AI modules.
//  */
// export const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

// export const AI_MODEL = "claude-3-5-haiku-20241022";

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not set. Add it to your .env.local file.",
  );
}

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const AI_MODEL = "gemini-3.1-pro-preview";
export const AI_TEMPERATURE = 0.2;

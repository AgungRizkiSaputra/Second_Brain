import { createGoogleGenerativeAI } from '@ai-sdk/google';

export function getGoogleApiKey(): string {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY atau GEMINI_API_KEY belum diatur.');
  }

  return apiKey;
}

export function createGoogleProvider() {
  return createGoogleGenerativeAI({ apiKey: getGoogleApiKey() });
}

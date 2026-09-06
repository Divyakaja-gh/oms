import { GoogleGenAI } from '@google/genai';

export async function generateContentWithFallback(
  ai: GoogleGenAI, 
  prompt: string, 
  defaultModel = 'gemini-3.1-flash-lite', 
  fallbackModel = 'gemini-flash-latest'
) {
  const modelsToTry = [defaultModel, fallbackModel, 'gemini-3.8-flash'];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return { 
        text: response.text || '', 
        fallbackUsed: i > 0,
        modelUsed: model
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${model} failed (${error.status || error.message || 'unknown'}). Trying next candidate...`);
    }
  }

  throw lastError;
}


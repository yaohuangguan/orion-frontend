import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini 3 Pro with high thinking budget for complex reasoning tasks.
 * STRICT REQUIREMENT: thinkingBudget is 32768, and maxOutputTokens is NOT set.
 */
export const askThinkingAgent = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768, // Max budget for deep reasoning
        },
        // IMPORTANT: maxOutputTokens is omitted to allow full thinking + response as per guidelines
      }
    });

    return response.text || "I thought deeply but could not articulate a response.";
  } catch (error) {
    console.error("Error in thinking agent:", error);
    return "I encountered an error while thinking. Please try again later.";
  }
};

/**
 * Standard chat for simpler interactions or summaries.
 */
export const askStandardAssistant = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error in standard assistant:", error);
    return "Error connecting to AI service.";
  }
};

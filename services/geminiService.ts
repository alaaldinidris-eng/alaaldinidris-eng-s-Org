import { GoogleGenAI } from "@google/genai";

export const generateImpactMessage = async (treeCount: number): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    // Initialize inside the function to use the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, enthusiastic one-sentence "thank you" message for someone who just sponsored ${treeCount} trees for a re-greening project. Focus on the environmental impact. Keep it under 20 words.`,
    });
    return response.text || `You just made the world a bit greener! Thank you for sponsoring ${treeCount} trees.`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Amazing work! Your ${treeCount} trees will help restore our natural ecosystem.`;
  }
};
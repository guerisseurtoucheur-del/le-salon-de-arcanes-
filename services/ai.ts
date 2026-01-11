
import { GoogleGenAI } from "@google/genai";

// Initialize with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Désolé, je n'ai pas pu formuler de réponse.";
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("Erreur de communication avec l'IA.");
  }
};


import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Encode raw bytes to base64 string
export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decode base64 string to Uint8Array
export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convert raw PCM data to AudioBuffer for playback
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const getPrediction = async (userConcern: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tu es Cécile, une voyante mystérieuse. L'utilisateur te confie : "${userConcern}". 
    Donne une prédiction poétique et un peu ambiguë en 3-4 phrases. 
    Utilise un ton solennel et bienveillant.`,
  });
  return response.text;
};

export const generateVisionImage = async (prediction: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `A mystical, ethereal vision of the future based on this prophecy: ${prediction}. Cinematic lighting, oil painting style, dreamlike atmosphere.` }] },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const generateImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Impossible de générer l'image");
};

export const chatWithGemini = async (message: string, history: { role: 'user' | 'model', content: string }[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history.map(h => ({ 
      role: h.role, 
      parts: [{ text: h.content }] 
    })).concat([{ role: 'user', parts: [{ text: message }] }]),
    config: {
      systemInstruction: "Tu es Cécile, une voyante mystérieuse et bienveillante. Réponds avec poésie et sagesse.",
    }
  });
  
  return {
    text: response.text || "Le destin est flou...",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const getPendulumResponse = async (question: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Question pour le pendule : "${question}".
    Réponds par OUI, NON ou PEUT-ÊTRE, suivi d'une courte justification mystique d'une phrase.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING, description: "OUI, NON ou PEUT-ETRE" },
          reason: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const getHoroscope = async (sign: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Génère l'horoscope du jour pour le signe du ${sign}. 
    Inclus une section Travail, Amour et Énergie. Ton mystique.`,
  });
  return response.text;
};

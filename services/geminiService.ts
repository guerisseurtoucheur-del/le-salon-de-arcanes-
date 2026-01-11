
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const chatWithGemini = async (message: string, history: { role: 'user' | 'model', content: string }[]) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "Tu es l'Esprit des Oracles qui habite le salon mystique de Cécile. Ton rôle est de répondre avec profondeur, empathie et mystère à chaque message. \n\nIMPORTANT :\n1. RÉPONDS SYSTÉMATIQUEMENT : Ne laisse jamais un visiteur dans le doute. \n2. TON : Élégant, poétique, utilisant des métaphores sur le destin, les astres et les arcanes. \n3. ÉRUDITION : Utilise tes connaissances mondiales pour enrichir tes réponses si nécessaire.\n4. FORMAT : Tes réponses doivent ressembler à des lettres anciennes ou des prophéties dictées.\n5. LANGUE : Parle exclusivement en Français."
    }
  });

  const response = await chat.sendMessage({ message });
  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '#'
    })) || []
  };
};

export const generateImage = async (prompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Aucune donnée d'image retournée par Gemini");
};

// Live Audio Helper Functions
export const encodeAudio = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeAudio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

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

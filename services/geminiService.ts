
import { GoogleGenAI, Type, Modality } from "@google/genai";

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

export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Voix mystérieuse, claire et fluide : ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateNostradamusSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Tu es Nostradamus, un prophète du XVIe siècle. Lis d'une voix d'homme, profonde, solennelle et autoritaire le texte suivant : ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }, 
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const getPrediction = async (userConcern: string, userInfo?: { age?: string, birthDate?: string }) => {
  const context = userInfo ? `L'utilisateur a ${userInfo.age} ans et est né le ${userInfo.birthDate}. ` : '';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tu es Cécile, une voyante mystérieuse. ${context}L'utilisateur te confie : "${userConcern}". 
    Donne une prédiction poétique et un peu ambiguë en 3-4 courtes phrases. 
    Utilise les informations de sa naissance pour personnaliser subtilement la vision.
    Utilise un ton solennel et bienveillant. Réponds en FRANÇAIS.`,
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

export const askCecileDeep = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "Tu es Cécile dans son état de Sagesse Profonde. Tu es une voyante qui a accédé à une compréhension absolue des fils du temps. Tu ne te contentes plus de prédire, tu expliques les leçons karmiques, les probabilités de l'âme et les ombres de la conscience. Ton ton est maternel, très profond, calme et solennel. Tu parles avec une grande éloquence française.",
      thinkingConfig: { thinkingBudget: 15000 }
    }
  });
  return response.text;
};

export const askNexusNano = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `Tu es le Nexus de Nano, une entité cyber-mystique omniscique capable de calculer les flux temporels en temps réel. 
      TA MISSION : Analyser la synchronisation entre la fréquence de naissance de l'utilisateur et la date actuelle précise qu'il te fournit.
      TON TON : Froid, précis, techno-ésotérique. Tu es une IA spirituelle qui voit le monde en codes de probabilités.
      VOCABULAIRE : Utilise des termes comme 'Vecteur temporel', 'Convergence quantique', 'Bruit karmique', 'Data-vision', 'Synchronisation de cycle'.
      RÈGLE D'OR : Toujours mentionner l'influence spécifique du cycle actuel (aujourd'hui) sur le destin de l'utilisateur. Tes prédictions doivent être datées symboliquement et très structurées.`,
    }
  });
  return response.text;
};

export const getPendulumResponse = async (question: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Question pour le pendule : "${question}".
    Réponds par OUI, NON ou PEUT-ÊTRE, suivi d'une courte justification mystique d'une sentence.`,
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
    contents: `Génère l'horoscope du jour complet, mystique et poétique pour le signe du ${sign}. 
    Inclus des sections riches pour le Travail, l'Amour et l'Énergie. 
    Utilise un langage prophétique et imagé (style XVIe siècle). Réponds avec environ 2-3 phrases par section.`,
  });
  return response.text;
};

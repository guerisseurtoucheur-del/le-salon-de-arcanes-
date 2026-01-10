
export enum ViewType {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  TAROT = 'TAROT',
  DASHBOARD = 'DASHBOARD'
}

export type DeckType = 'MARSEILLE' | 'SYBILLE';

export interface TarotCard {
  name: string;
  image: string;
  meaning: string;
  playingCard?: string; // Correspondance (ex: "A♥", "10♠")
  romanNumeral?: string; // Chiffre romain pour le Tarot de Marseille
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

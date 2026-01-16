
export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  TAROT = 'TAROT',
  CRYSTAL_BALL = 'CRYSTAL_BALL',
  ASTROLOGY = 'ASTROLOGY',
  PENDULUM = 'PENDULUM',
  CHAT = 'CHAT',
  CECIL_DEEP = 'CECIL_DEEP',
  NEXUS = 'NEXUS',
  GRIMOIRE = 'GRIMOIRE'
}

export type TarotDeck = 'MARSEILLE' | 'ORACLE';
export type DeckType = 'MARSEILLE' | 'ORACLE';

export interface TarotCard {
  name: string;
  image: string;
  meaning: string;
  romanNumeral?: string;
  playingCard?: string;
  color?: string;
  roman?: string;
}

export interface AstrologySign {
  name: string;
  dates: string;
  element: string;
  symbol: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: any[];
  thinking?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  type: ViewType;
  date: number;
  title: string;
  content: string;
  image?: string;
  cards?: TarotCard[];
}

export const ZODIAC_SIGNS: AstrologySign[] = [
  { name: 'Bélier', dates: '21 Mars - 19 Avril', element: 'Feu', symbol: '♈' },
  { name: 'Taureau', dates: '20 Avril - 20 Mai', element: 'Terre', symbol: '♉' },
  { name: 'Gémeaux', dates: '21 Mai - 20 Juin', element: 'Air', symbol: '♊' },
  { name: 'Cancer', dates: '21 Juin - 22 Juillet', element: 'Eau', symbol: '♋' },
  { name: 'Lion', dates: '23 Juillet - 22 Août', element: 'Feu', symbol: '♌' },
  { name: 'Vierge', dates: '23 Août - 22 Septembre', element: 'Terre', symbol: '♍' },
  { name: 'Balance', dates: '23 Septembre - 22 Octobre', element: 'Air', symbol: '♎' },
  { name: 'Scorpion', dates: '23 Octobre - 21 Novembre', element: 'Eau', symbol: '♏' },
  { name: 'Sagittaire', dates: '22 Novembre - 21 Décembre', element: 'Feu', symbol: '♐' },
  { name: 'Capricorne', dates: '22 Décembre - 19 Janvier', element: 'Terre', symbol: '♑' },
  { name: 'Verseau', dates: '20 Janvier - 18 Février', element: 'Air', symbol: '♒' },
  { name: 'Poissons', dates: '19 Février - 20 Mars', element: 'Eau', symbol: '♓' }
];

export const AUDIO_THEMES: Record<ViewType, string> = {
  [ViewType.DASHBOARD]: 'https://assets.mixkit.co/music/preview/mixkit-meditation-soft-702.mp3',
  [ViewType.TAROT]: 'https://assets.mixkit.co/music/preview/mixkit-mysterious-pensive-704.mp3',
  [ViewType.CRYSTAL_BALL]: 'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-701.mp3',
  [ViewType.ASTROLOGY]: 'https://assets.mixkit.co/music/preview/mixkit-meditation-soft-702.mp3',
  [ViewType.PENDULUM]: 'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-night-211.mp3',
  [ViewType.CECIL_DEEP]: 'https://assets.mixkit.co/music/preview/mixkit-cinematic-mystery-suspense-672.mp3',
  [ViewType.NEXUS]: 'https://assets.mixkit.co/music/preview/mixkit-ethereal-dreams-639.mp3',
  [ViewType.CHAT]: 'https://assets.mixkit.co/music/preview/mixkit-ethereal-dreams-639.mp3',
  [ViewType.GRIMOIRE]: 'https://assets.mixkit.co/music/preview/mixkit-meditation-soft-702.mp3'
};


export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  TAROT = 'TAROT',
  CRYSTAL_BALL = 'CRYSTAL_BALL',
  ASTROLOGY = 'ASTROLOGY',
  PENDULUM = 'PENDULUM',
  CHAT = 'CHAT',
  CECIL_DEEP = 'CECIL_DEEP',
  NEXUS = 'NEXUS'
}

export type TarotDeck = 'MARSEILLE' | 'RIDER_WAITE';
export type DeckType = 'MARSEILLE' | 'SYBILLE';

export interface TarotCard {
  name: string;
  image: string;
  meaning: string;
  romanNumeral?: string;
  playingCard?: string;
}

export interface AstrologySign {
  name: string;
  dates: string;
  element: string;
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

export const ZODIAC_SIGNS: AstrologySign[] = [
  { name: 'Bélier', dates: '21 Mars - 19 Avril', element: 'Feu' },
  { name: 'Taureau', dates: '20 Avril - 20 Mai', element: 'Terre' },
  { name: 'Gémeaux', dates: '21 Mai - 20 Juin', element: 'Air' },
  { name: 'Cancer', dates: '21 Juin - 22 Juillet', element: 'Eau' },
  { name: 'Lion', dates: '23 Juillet - 22 Août', element: 'Feu' },
  { name: 'Vierge', dates: '23 Août - 22 Septembre', element: 'Terre' },
  { name: 'Balance', dates: '23 Septembre - 22 Octobre', element: 'Air' },
  { name: 'Scorpion', dates: '23 Octobre - 21 Novembre', element: 'Eau' },
  { name: 'Sagittaire', dates: '22 Novembre - 21 Décembre', element: 'Feu' },
  { name: 'Capricorne', dates: '22 Décembre - 19 Janvier', element: 'Terre' },
  { name: 'Verseau', dates: '20 Janvier - 18 Février', element: 'Air' },
  { name: 'Poissons', dates: '19 Février - 20 Mars', element: 'Eau' }
];

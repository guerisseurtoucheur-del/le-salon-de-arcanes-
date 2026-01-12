
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

// Utilisation de sons d'ambiance Google très stables
export const AUDIO_THEMES: Record<ViewType, string> = {
  [ViewType.DASHBOARD]: 'https://actions.google.com/sounds/v1/ambiences/night_ambience.ogg',
  [ViewType.TAROT]: 'https://actions.google.com/sounds/v1/ambiences/wind_chimes_and_birds.ogg',
  [ViewType.CRYSTAL_BALL]: 'https://actions.google.com/sounds/v1/ambiences/glitchy_waves.ogg',
  [ViewType.ASTROLOGY]: 'https://actions.google.com/sounds/v1/ambiences/crystal_bowl_vibrations.ogg',
  [ViewType.PENDULUM]: 'https://actions.google.com/sounds/v1/ambiences/mystical_white_noise.ogg',
  [ViewType.CECIL_DEEP]: 'https://actions.google.com/sounds/v1/ambiences/deep_space.ogg',
  [ViewType.NEXUS]: 'https://actions.google.com/sounds/v1/ambiences/static_hum.ogg',
  [ViewType.CHAT]: 'https://actions.google.com/sounds/v1/ambiences/night_ambience.ogg'
};

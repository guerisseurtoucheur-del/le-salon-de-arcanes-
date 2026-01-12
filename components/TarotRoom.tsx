
import React, { useState } from 'react';

const TAROT_MARSEILLE = [
  { name: "LE BATELEUR", image: "🧙", roman: "I", color: "#d4a017" }, // Yellow
  { name: "LA PAPESSE", image: "📖", roman: "II", color: "#2b547e" }, // Blue
  { name: "L'IMPÉRATRICE", image: "👑", roman: "III", color: "#4e9258" }, // Green
  { name: "L'EMPEREUR", image: "🛡️", roman: "IIII", color: "#990000" }, // Red
  { name: "LE PAPE", image: "🕊️", roman: "V", color: "#990000" }, // Red
  { name: "L'AMOUREUX", image: "❤️", roman: "VI", color: "#d4a017" }, // Yellow
  { name: "LE CHARIOT", image: "🚜", roman: "VII", color: "#2b547e" }, // Blue
  { name: "LA JUSTICE", image: "⚖️", roman: "VIII", color: "#4e9258" }, // Green
  { name: "L'ERMITE", image: "🕯️", roman: "VIIII", color: "#990000" }, // Red
  { name: "LA ROUE DE FORTUNE", image: "🎡", roman: "X", color: "#4e9258" }, // Green
  { name: "LA FORCE", image: "🦁", roman: "XI", color: "#990000" }, // Red
  { name: "LE PENDU", image: "🤸", roman: "XII", color: "#2b547e" }, // Blue
  { name: "LA MORT", image: "💀", roman: "XIII", color: "#1a1510" }, // Black
  { name: "LA TEMPÉRANCE", image: "🍶", roman: "XIIII", color: "#4e9258" }, // Green
  { name: "LE DIABLE", image: "😈", roman: "XV", color: "#990000" }, // Red
  { name: "LA MAISON DIEU", image: "🏰", roman: "XVI", color: "#d4a017" }, // Yellow
  { name: "L'ÉTOILE", image: "⭐", roman: "XVII", color: "#2b547e" }, // Blue
  { name: "LA LUNE", image: "🌙", roman: "XVIII", color: "#2b547e" }, // Blue
  { name: "LE SOLEIL", image: "☀️", roman: "XVIIII", color: "#d4a017" }, // Yellow
  { name: "LE JUGEMENT", image: "🎺", roman: "XX", color: "#4e9258" }, // Green
  { name: "LE MONDE", image: "🌍", roman: "XXI", color: "#d4a017" }, // Yellow
  { name: "LE MAT", image: "🚶", roman: " ", color: "#990000" }, // Red
];

const RIDER_WAITE = [
  { name: "The Magician", image: "✨" },
  { name: "The High Priestess", image: "🌙" },
  { name: "The Empress", image: "🌿" },
  { name: "The Emperor", image: "🛡️" },
  { name: "The Hierophant", image: "🛐" },
  { name: "The Lovers", image: "🕊️" },
  { name: "Strength", image: "🦁" },
  { name: "The Star", image: "⭐" },
];

const ORACLE_CARDS = [
  { name: "La Destinée", image: "🗝️" },
  { name: "L'Élévation", image: "🧗" },
  { name: "La Réussite", image: "🏆" },
  { name: "L'Inconstance", image: "🌪️" },
  { name: "La Pensée", image: "💭" },
  { name: "Le Cadeau", image: "🎁" },
  { name: "La Fidélité", image: "🐕" },
  { name: "L'Union", image: "💍" },
];

const TarotRoom: React.FC<{ onBack: () => void }> = () => {
  const [deckType, setDeckType] = useState<'MARSEILLE' | 'RIDER_WAITE' | 'ORACLE'>('MARSEILLE');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [isReading, setIsReading] = useState(false);

  const drawCards = () => {
    let sourceDeck;
    if (deckType === 'MARSEILLE') sourceDeck = TAROT_MARSEILLE;
    else if (deckType === 'RIDER_WAITE') sourceDeck = RIDER_WAITE;
    else sourceDeck = ORACLE_CARDS;

    const shuffled = [...sourceDeck].sort(() => 0.5 - Math.random());
    setSelectedCards(shuffled.slice(0, 3));
    setIsReading(true);
  };

  const getDeckBackClass = () => {
    if (deckType === 'MARSEILLE') return 'back-marseille';
    if (deckType === 'RIDER_WAITE') return 'back-rider';
    return 'back-oracle';
  };

  return (
    <div className="space-y-16 py-6">
      <div className="flex justify-center flex-wrap gap-6 md:gap-10">
        <button 
          onClick={() => { setDeckType('MARSEILLE'); setIsReading(false); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'MARSEILLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >TAROT DE MARSEILLE</button>
        <button 
          onClick={() => { setDeckType('RIDER_WAITE'); setIsReading(false); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'RIDER_WAITE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >RIDER-WAITE</button>
        <button 
          onClick={() => { setDeckType('ORACLE'); setIsReading(false); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'ORACLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >ORACLE MYSTIQUE</button>
      </div>

      {!isReading ? (
        <div className="text-center py-12">
          <div className="mb-12 flex justify-center gap-6 py-10 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`w-32 h-52 card-back-pattern ${getDeckBackClass()} shadow-2xl transition-all duration-500 hover:-translate-y-6 hover:rotate-3 flex items-center justify-center`}
              >
                <span className="card-back-icon text-4xl">{deckType === 'MARSEILLE' ? '☀️' : deckType === 'RIDER_WAITE' ? '☸️' : '👁️'}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={drawCards}
            className="px-16 py-6 bg-gradient-to-b from-purple-900 to-black text-gold-bright font-mystic text-2xl tracking-[0.3em] border-2 border-gold-bright hover:scale-105 transition-all shadow-[0_0_40px_rgba(184,134,11,0.3)] uppercase"
          >
            Mélanger les Arcanes
          </button>
        </div>
      ) : (
        <div className="space-y-16 animate-in fade-in duration-1000">
          <div className="flex justify-center gap-10 md:gap-14 flex-wrap">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="text-xs font-mystic uppercase tracking-[0.4em] text-gold-muted/60">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                
                {deckType === 'MARSEILLE' ? (
                  <div className="w-56 h-96 card-marseille-authentic hover:-translate-y-4">
                    <div className="card-marseille-inner" style={{ borderColor: card.color }}>
                      <div className="card-marseille-accent-frame" style={{ borderColor: card.color }}>
                        <div className="card-marseille-header" style={{ color: card.color }}>{card.roman}</div>
                        <div className="card-marseille-illustration">
                          <span className="text-8xl drop-shadow-lg">{card.image}</span>
                        </div>
                        <div className="card-marseille-footer">
                          <div className="card-marseille-title">{card.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-88 bg-[#fdf6e3] p-1 border-4 border-gold-muted shadow-[0_20px_50px_rgba(0,0,0,0.7)] transform transition-transform hover:-translate-y-4 rounded-sm">
                    <div className="h-full w-full border-2 border-gold-muted/20 flex flex-col items-center justify-between p-4">
                        <div className="text-xs font-bold text-amber-900 opacity-40 uppercase tracking-tighter">
                          {deckType === 'ORACLE' ? 'Oracle des Destins' : 'Rider-Waite Smith'}
                        </div>
                        <span className="text-8xl drop-shadow-md my-6">{card.image}</span>
                        <h4 className="font-mystic text-amber-950 text-xl text-center leading-none border-t border-gold-muted/30 pt-4 w-full uppercase">{card.name}</h4>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
             <button 
                onClick={() => setIsReading(false)} 
                className="text-gold-muted hover:text-gold-bright font-mystic text-sm uppercase tracking-widest transition-colors flex items-center gap-3 mx-auto"
              >
               <span className="text-xl">←</span> Purifier le jeu
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotRoom;

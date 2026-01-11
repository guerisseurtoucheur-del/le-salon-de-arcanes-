
import React, { useState } from 'react';

const TAROT_CARDS = [
  { name: "Le Bateleur", image: "🧙", meaning: "Potentiel, nouveaux départs." },
  { name: "La Papesse", image: "📖", meaning: "Intuition, mystère." },
  { name: "L'Amoureux", image: "❤️", meaning: "Choix, relations." },
  { name: "La Roue de Fortune", image: "🎡", meaning: "Cycles, destin." },
  { name: "Le Pendu", image: "🤸", meaning: "Perspective, pause." },
  { name: "Le Monde", image: "🌍", meaning: "Accomplissement." },
  { name: "Le Soleil", image: "☀️", meaning: "Clarté, succès." },
  { name: "L'Ermite", image: "🕯️", meaning: "Introspection." },
];

const TarotRoom: React.FC<{ onBack: () => void }> = () => {
  const [deckType, setDeckType] = useState<'MARSEILLE' | 'RIDER_WAITE'>('MARSEILLE');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [isReading, setIsReading] = useState(false);

  const drawCards = () => {
    const shuffled = [...TAROT_CARDS].sort(() => 0.5 - Math.random());
    setSelectedCards(shuffled.slice(0, 3));
    setIsReading(true);
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-center gap-8">
        <button 
          onClick={() => setDeckType('MARSEILLE')}
          className={`px-4 py-2 border ${deckType === 'MARSEILLE' ? 'bg-gold-muted text-black' : 'border-gold-muted'}`}
        >Tarot de Marseille</button>
        <button 
          onClick={() => setDeckType('RIDER_WAITE')}
          className={`px-4 py-2 border ${deckType === 'RIDER_WAITE' ? 'bg-gold-muted text-black' : 'border-gold-muted'}`}
        >Rider-Waite</button>
      </div>

      {!isReading ? (
        <div className="text-center">
          <button 
            onClick={drawCards}
            className="px-12 py-4 bg-red-900 text-gold-bright font-mystic text-xl border-2 border-gold-bright hover:bg-red-800"
          >
            Mélanger & Tirer 3 Cartes
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="flex justify-center gap-8 flex-wrap">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-4 animate-fade" style={{ animationDelay: `${i * 0.2}s` }}>
                <span className="text-sm uppercase tracking-widest text-gold-muted">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                <div className="tarot-card bg-parchment p-4 border-4 border-ink shadow-2xl">
                  <span className="text-6xl">{card.image}</span>
                  <h4 className="mt-4 font-bold text-center">{card.name}</h4>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-black/40 border border-gold-muted rounded-lg text-center">
            <h3 className="text-xl font-mystic mb-4">Interprétation des Arcanes</h3>
            <p className="italic">"{selectedCards.map(c => c.meaning).join(' ')}"</p>
          </div>
          <div className="text-center">
             <button onClick={() => setIsReading(false)} className="text-gold-muted hover:text-gold-bright">← Recommencer le tirage</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotRoom;

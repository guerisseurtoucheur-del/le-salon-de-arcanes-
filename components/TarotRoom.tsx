import React, { useState } from 'react';

const TAROT_CARDS = [
  { name: "Le Bateleur", image: "🧙", meaning: "Potentiel infini, nouveaux départs." },
  { name: "La Papesse", image: "📖", meaning: "Intuition profonde, mystères cachés." },
  { name: "L'Amoureux", image: "❤️", meaning: "Choix de l'âme, unions sacrées." },
  { name: "La Roue de Fortune", image: "🎡", meaning: "Cycles éternels, destin en marche." },
  { name: "Le Pendu", image: "🤸", meaning: "Perspectives nouvelles, lâcher-prise." },
  { name: "Le Monde", image: "🌍", meaning: "Accomplissement total, harmonie." },
  { name: "Le Soleil", image: "☀️", meaning: "Clarté divine, succès éclatant." },
  { name: "L'Ermite", image: "🕯️", meaning: "Sagesse intérieure, introspection." },
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
    <div className="space-y-16 py-6">
      <div className="flex justify-center gap-10">
        <button 
          onClick={() => setDeckType('MARSEILLE')}
          className={`px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'MARSEILLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted text-gold-muted hover:border-gold-bright'}`}
        >TAROT DE MARSEILLE</button>
        <button 
          onClick={() => setDeckType('RIDER_WAITE')}
          className={`px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'RIDER_WAITE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted text-gold-muted hover:border-gold-bright'}`}
        >RIDER-WAITE</button>
      </div>

      {!isReading ? (
        <div className="text-center py-12">
          <div className="mb-12 flex justify-center gap-4 opacity-30">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-20 h-32 border-2 border-gold-muted rounded-lg bg-purple-950/40 transform rotate-[-5deg]"></div>
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
          <div className="flex justify-center gap-10 md:gap-20 flex-wrap">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="text-xs font-mystic uppercase tracking-[0.4em] text-gold-muted/60">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                <div className="w-56 h-88 bg-[#fdf6e3] p-1 border-4 border-gold-muted shadow-[0_20px_50px_rgba(0,0,0,0.7)] transform transition-transform hover:-translate-y-4 rounded-sm">
                   <div className="h-full w-full border-2 border-gold-muted/20 flex flex-col items-center justify-between p-4">
                      <div className="text-xs font-bold text-amber-900 opacity-40 uppercase tracking-tighter">Arcane Majeur</div>
                      <span className="text-8xl drop-shadow-md my-6">{card.image}</span>
                      <h4 className="font-mystic text-amber-950 text-xl text-center leading-none border-t border-gold-muted/30 pt-4 w-full uppercase">{card.name}</h4>
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-10 glass-mystic gold-border rounded-3xl text-center max-w-3xl mx-auto shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-8 bg-purple-950 border-2 border-gold-muted font-mystic text-gold-bright text-xl uppercase tracking-widest">Vision de l'Oracle</div>
            <p className="italic text-3xl font-cursive text-gold-bright leading-relaxed px-6">
              "Les fils de votre destin s'entrelacent : {selectedCards.map(c => c.meaning).join(' ')}"
            </p>
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
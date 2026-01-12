
import React, { useState } from 'react';

const TAROT_MARSEILLE = [
  { name: "Le Bateleur", image: "🧙", meaning: "Potentiel infini, nouveaux départs." },
  { name: "La Papesse", image: "📖", meaning: "Intuition profonde, mystères cachés." },
  { name: "L'Amoureux", image: "❤️", meaning: "Choix de l'âme, unions sacrées." },
  { name: "La Roue de Fortune", image: "🎡", meaning: "Cycles éternels, destin en marche." },
  { name: "Le Pendu", image: "🤸", meaning: "Perspectives nouvelles, lâcher-prise." },
  { name: "Le Monde", image: "🌍", meaning: "Accomplissement total, harmonie." },
  { name: "Le Soleil", image: "☀️", meaning: "Clarté divine, succès éclatant." },
  { name: "L'Ermite", image: "🕯️", meaning: "Sagesse intérieure, introspection." },
];

const RIDER_WAITE = [
  { name: "Le Magicien", image: "✨", meaning: "Action, volonté, manifestation." },
  { name: "La Grande Prêtresse", image: "🌙", meaning: "Sagesse, inconscient, mystère." },
  { name: "L'Impératrice", image: "🌿", meaning: "Abondance, nature, créativité." },
  { name: "L'Empereur", image: "🛡️", meaning: "Autorité, structure, protection." },
  { name: "Le Hiérophante", image: "🛐", meaning: "Tradition, apprentissage, mentor." },
  { name: "Les Amants", image: "🕊️", meaning: "Harmonie, values, alignement." },
  { name: "La Force", image: "🦁", meaning: "Courage, compassion, mastery." },
  { name: "L'Étoile", image: "⭐", meaning: "Espoir, inspiration, sérénité." },
];

const ORACLE_CARDS = [
  { name: "La Destinée", image: "🗝️", meaning: "Une porte s'ouvre, le destin s'accomplit." },
  { name: "L'Élévation", image: "🧗", meaning: "Progrès spirituel ou social, succès." },
  { name: "La Réussite", image: "🏆", meaning: "Triomphe après l'effort, récompense." },
  { name: "L'Inconstance", image: "🌪️", meaning: "Changements rapides, incertitude passagère." },
  { name: "La Pensée", image: "💭", meaning: "Réflexion nécessaire, projets en gestation." },
  { name: "Le Cadeau", image: "🎁", meaning: "Une surprise arrive, générosité du sort." },
  { name: "La Fidélité", image: "🐕", meaning: "Soutien sincère, amitié durable." },
  { name: "L'Union", image: "💍", meaning: "Alliance, contrat ou rencontre marquante." },
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
          <div className="mb-12 flex justify-center gap-4 opacity-30">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-24 h-36 border-2 border-gold-muted/50 rounded-lg bg-purple-950/40 transform rotate-[-5deg] flex flex-col items-center justify-between py-4 relative overflow-hidden">
                <span className="text-xs verso-moon-symbol">☾</span>
                <span className="text-3xl verso-placeholder-symbol">👁️</span>
                <span className="text-xs verso-moon-symbol">☽</span>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.1)_0%,transparent_70%)] animate-pulse"></div>
              </div>
            ))}
          </div>
          <button 
            onClick={drawCards}
            className="px-16 py-6 bg-gradient-to-b from-purple-900 to-black text-gold-bright font-mystic text-2xl tracking-[0.3em] border-2 border-gold-bright hover:scale-105 transition-all shadow-[0_0_40px_rgba(184,134,11,0.3)] uppercase"
          >
            Mélanger les Arcanes
          </button>
          <p className="mt-8 text-gold-muted italic font-serif">
            {deckType === 'ORACLE' ? "L'Oracle vous parlera des événements concrets de votre vie." : "Le Tarot vous révélera les profondeurs de votre âme."}
          </p>
        </div>
      ) : (
        <div className="space-y-16 animate-in fade-in duration-1000">
          <div className="flex justify-center gap-10 md:gap-20 flex-wrap">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="text-xs font-mystic uppercase tracking-[0.4em] text-gold-muted/60">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                <div className="w-56 h-88 bg-[#fdf6e3] p-1 border-4 border-gold-muted shadow-[0_20px_50px_rgba(0,0,0,0.7)] transform transition-transform hover:-translate-y-4 rounded-sm">
                   <div className="h-full w-full border-2 border-gold-muted/20 flex flex-col items-center justify-between p-4">
                      <div className="text-xs font-bold text-amber-900 opacity-40 uppercase tracking-tighter">
                        {deckType === 'ORACLE' ? 'Oracle des Destins' : 'Arcane Majeur'}
                      </div>
                      <span className="text-8xl drop-shadow-md my-6">{card.image}</span>
                      <h4 className="font-mystic text-amber-950 text-xl text-center leading-none border-t border-gold-muted/30 pt-4 w-full uppercase">{card.name}</h4>
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-10 glass-mystic gold-border rounded-3xl text-center max-w-3xl mx-auto shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-8 bg-purple-950 border-2 border-gold-muted font-mystic text-gold-bright text-xl uppercase tracking-widest">Vision de l'Oracle</div>
            <p className="italic text-2xl md:text-3xl font-cursive text-gold-bright leading-relaxed px-6">
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

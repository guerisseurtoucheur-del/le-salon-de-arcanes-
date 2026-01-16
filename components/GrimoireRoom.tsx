
import React, { useState, useEffect } from 'react';
import { getHistory, clearHistory } from '../services/historyService';
import { HistoryEntry } from '../types';

const GrimoireRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-mystic text-gold-bright tracking-widest uppercase">Mémoire du Destin</h2>
        <p className="text-gold-muted font-serif-elegant italic text-2xl">Relisez les murmures passés de l'invisible.</p>
      </div>

      {history.length === 0 ? (
        <div className="py-20 text-center glass-mystic rounded-[3rem] gold-border">
          <p className="font-mystic text-gold-muted text-xl uppercase tracking-widest opacity-40">Votre grimoire est encore vierge...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.map((entry) => (
            <div key={entry.id} className="parchment p-8 rounded-[2rem] antique-border shadow-2xl animate-in slide-in-from-bottom-10 flex flex-col md:flex-row gap-8 items-center md:items-start group hover:scale-[1.01] transition-all">
              {entry.image && (
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-amber-900/20 shadow-xl shrink-0">
                  <img src={entry.image} alt="Vision" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start border-b border-amber-900/10 pb-2">
                  <span className="font-mystic text-amber-900 text-sm uppercase tracking-widest">{entry.title}</span>
                  <span className="text-[10px] text-amber-900/40 font-serif italic">{formatDate(entry.date)}</span>
                </div>
                {entry.cards && (
                  <div className="flex gap-2 mb-4">
                    {entry.cards.map((c, i) => (
                      <span key={i} title={c.name} className="text-2xl filter drop-shadow-sm">{c.image}</span>
                    ))}
                  </div>
                )}
                <p className="text-amber-950 font-serif-elegant italic text-xl leading-relaxed">
                  "{entry.content}"
                </p>
              </div>
            </div>
          ))}
          
          <button onClick={() => { clearHistory(); setHistory([]); }} className="w-full py-4 text-red-900/40 font-mystic text-[10px] uppercase tracking-widest hover:text-red-600 transition-all">
            Effacer toutes les traces de ce monde
          </button>
        </div>
      )}
    </div>
  );
};

export default GrimoireRoom;

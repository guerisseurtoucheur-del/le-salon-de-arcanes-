import React, { useState } from 'react';
import { ZODIAC_SIGNS } from '../types';
import { getHoroscope } from '../services/geminiService';

const AstrologyRoom: React.FC<{ onBack: () => void }> = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscope, setHoroscope] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHoroscope = async (sign: string) => {
    setSelectedSign(sign);
    setLoading(true);
    setHoroscope('');
    try {
      const res = await getHoroscope(sign);
      setHoroscope(res || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 py-6">
      <div className="text-center space-y-2 mb-8 animate-fade">
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Cercle du Zodiaque</h2>
        <p className="text-gold-muted font-cursive text-2xl italic">Lisez la volonté des astres dans le firmament.</p>
      </div>

      {!selectedSign ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4">
          {ZODIAC_SIGNS.map((sign) => (
            <button
              key={sign.name}
              onClick={() => fetchHoroscope(sign.name)}
              className="p-6 bg-gradient-to-br from-purple-950/60 to-black/80 border-2 border-gold-muted/20 rounded-2xl hover:border-gold-bright hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all group flex flex-col items-center"
            >
              <span className="block text-4xl mb-4 group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">{sign.name}</span>
              <span className="text-[10px] text-gold-muted font-mystic uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{sign.dates}</span>
              <div className="mt-3 w-8 h-[1px] bg-gold-muted/30 group-hover:w-16 transition-all"></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between border-b-2 border-gold-muted/30 pb-6">
            <h2 className="text-5xl font-mystic text-gold-bright drop-shadow-lg uppercase tracking-wider">Horoscope du {selectedSign}</h2>
            <button 
              onClick={() => setSelectedSign(null)} 
              className="px-6 py-2 border border-gold-muted/40 text-gold-muted hover:text-gold-bright hover:border-gold-bright transition-all font-mystic text-xs uppercase tracking-widest"
            >
              Changer de signe
            </button>
          </div>

          {loading ? (
            <div className="text-center py-32 flex flex-col items-center gap-8">
               <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-gold-muted/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-gold-bright rounded-full animate-spin"></div>
               </div>
               <span className="font-mystic text-gold-bright text-2xl tracking-[0.3em] animate-pulse">LES ÉTOILES S'ALIGNENT...</span>
            </div>
          ) : (
            <div className="glass-mystic gold-border p-12 rounded-[3rem] shadow-3xl relative overflow-hidden">
               {/* Aesthetic constellation overlay */}
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-9xl">✨</div>
               <div className="prose prose-invert max-w-none prose-headings:text-gold-bright prose-p:text-gold-muted text-2xl leading-relaxed whitespace-pre-wrap italic font-serif">
                 {horoscope}
               </div>
               <div className="mt-10 flex justify-center opacity-30">
                  <span className="text-2xl text-gold-bright">☾ ✦ ☽</span>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AstrologyRoom;
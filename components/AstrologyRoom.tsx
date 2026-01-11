
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
    <div className="space-y-8">
      {!selectedSign ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {ZODIAC_SIGNS.map((sign) => (
            <button
              key={sign.name}
              onClick={() => fetchHoroscope(sign.name)}
              className="p-4 bg-black/40 border border-gold-muted/20 rounded hover:border-gold-bright transition-all group"
            >
              <span className="block text-2xl mb-2 group-hover:scale-125 transition-transform">{sign.name}</span>
              <span className="text-[10px] text-gold-muted/50 uppercase">{sign.dates}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-8 animate-fade">
          <div className="flex items-center justify-between border-b border-gold-muted pb-4">
            <h2 className="text-3xl font-mystic text-gold-bright">Horoscope du {selectedSign}</h2>
            <button onClick={() => setSelectedSign(null)} className="text-sm text-gold-muted hover:text-gold-bright">Changer de signe</button>
          </div>

          {loading ? (
            <div className="text-center py-20 font-mystic animate-pulse">Consultation des constellations en cours...</div>
          ) : (
            <div className="prose prose-invert max-w-none prose-headings:text-gold-bright prose-p:text-gold-muted text-xl leading-relaxed whitespace-pre-wrap italic">
              {horoscope}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AstrologyRoom;

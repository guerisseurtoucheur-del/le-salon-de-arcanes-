
import React, { useState, useEffect, useRef } from 'react';
import { ZODIAC_SIGNS } from '../types';
import { getHoroscope, generateNostradamusSpeech, decodeAudio, decodeAudioData } from '../services/geminiService';

const NORMAL_SYMBOLS: Record<string, string> = {
  'Bélier': '🐏',
  'Taureau': '🐂',
  'Gémeaux': '👥',
  'Cancer': '🦀',
  'Lion': '🦁',
  'Vierge': '👸',
  'Balance': '⚖️',
  'Scorpion': '🦂',
  'Sagittaire': '🏹',
  'Capricorne': '🐐',
  'Verseau': '🏺',
  'Poissons': '🐟'
};

const AstrologyRoom: React.FC<{ onBack: () => void }> = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscope, setHoroscope] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const fetchHoroscope = async (sign: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
    }

    setIsSpeaking(false);
    setSelectedSign(sign);
    setLoading(true);
    setHoroscope('');
    setIsAudioLoading(true);
    
    try {
      const text = await getHoroscope(sign);
      setHoroscope(text || '');
      setLoading(false);

      if (text) {
        const audioData = await generateNostradamusSpeech(text);
        if (audioData && audioContextRef.current) {
          const buffer = await decodeAudioData(decodeAudio(audioData), audioContextRef.current, 24000, 1);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => {
            setIsSpeaking(false);
          };
          
          sourceRef.current = source;
          source.start(0);
          setIsSpeaking(true);
        }
      }
    } catch (e) {
      console.error("Erreur astrologique:", e);
      setLoading(false);
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className="space-y-12 py-6">
      <div className="text-center space-y-4 mb-8 animate-fade">
        <div className="inline-block px-10 py-2 bg-gold-muted/10 border-2 border-gold-bright/20 rounded-full mb-2 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <span className="text-xs font-mystic text-gold-bright uppercase tracking-[0.4em]">✧ Alignement Céleste du Jour ✧</span>
        </div>
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest drop-shadow-lg">Le Cercle du Zodiaque</h2>
      </div>

      {!selectedSign ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4">
          {ZODIAC_SIGNS.map((sign) => (
            <button 
              key={sign.name} 
              onClick={() => fetchHoroscope(sign.name)} 
              className="p-6 bg-black/60 border-2 border-gold-muted/20 rounded-2xl hover:border-gold-bright hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all group flex flex-col items-center"
            >
              <span className="block text-6xl mb-4 text-gold-bright group-hover:scale-125 transition-transform duration-700">{NORMAL_SYMBOLS[sign.name] || sign.symbol}</span>
              <span className="block text-xl font-mystic text-gold-bright tracking-widest">{sign.name}</span>
              <span className="block text-[10px] text-gold-muted/60 font-serif italic mt-1">{sign.dates}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b-2 border-gold-muted/30 pb-6">
            <div className="flex items-center gap-6">
               <span className="text-6xl text-gold-bright">{NORMAL_SYMBOLS[selectedSign] || ZODIAC_SIGNS.find(s => s.name === selectedSign)?.symbol}</span>
               <div className="flex flex-col">
                 <h2 className="text-5xl font-mystic text-gold-bright uppercase tracking-wider leading-none">{selectedSign}</h2>
                 <span className="text-gold-muted/60 font-serif italic mt-1">{ZODIAC_SIGNS.find(s => s.name === selectedSign)?.dates}</span>
               </div>
            </div>
            <button 
              onClick={() => {
                if (sourceRef.current) try { sourceRef.current.stop(); } catch(e) {}
                setSelectedSign(null);
                setHoroscope('');
              }} 
              className="px-6 py-2 border border-gold-muted/40 text-gold-muted hover:text-gold-bright transition-all font-mystic text-xs uppercase tracking-widest"
            >
              Retour au Cercle
            </button>
          </div>

          <div className="relative glass-mystic gold-border p-12 rounded-[3rem] shadow-3xl overflow-hidden min-h-[300px] flex items-center justify-center">
            {loading ? (
              <div className="text-center flex flex-col items-center gap-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gold-muted/20 border-t-gold-bright rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
                </div>
                <span className="font-mystic text-gold-bright text-xl tracking-[0.3em] animate-pulse uppercase">Nostradamus consulte les sphères...</span>
              </div>
            ) : (
              <div className="w-full text-center">
                <div className="prose prose-invert max-w-none text-blue-100/90 font-serif text-3xl leading-relaxed italic whitespace-pre-wrap animate-in fade-in duration-1000">
                  {horoscope}
                </div>
                
                {isAudioLoading && !isSpeaking && (
                   <div className="mt-8 flex items-center justify-center gap-3">
                     <div className="w-2 h-2 bg-gold-bright rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gold-bright rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="w-2 h-2 bg-gold-bright rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     <span className="text-xs font-mystic text-gold-muted uppercase tracking-widest">Invoquer la parole...</span>
                   </div>
                )}

                {isSpeaking && (
                  <div className="mt-10 flex justify-center gap-1 h-12 items-end">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-gold-bright/80 rounded-full animate-[pulse_1s_infinite]" 
                        style={{ 
                          height: `${40 + Math.random() * 60}%`, 
                          animationDelay: `${i * 0.05}s`,
                          opacity: 0.3 + Math.random() * 0.7
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="absolute -bottom-10 -right-10 text-9xl text-gold-bright/5 rotate-12 pointer-events-none select-none font-mystic">
              {NORMAL_SYMBOLS[selectedSign] || ZODIAC_SIGNS.find(s => s.name === selectedSign)?.symbol}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AstrologyRoom;

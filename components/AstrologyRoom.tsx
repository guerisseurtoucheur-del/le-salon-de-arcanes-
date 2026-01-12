
import React, { useState, useEffect, useRef } from 'react';
import { ZODIAC_SIGNS } from '../types';
import { getHoroscope, generateNostradamusSpeech, decodeAudio, decodeAudioData } from '../services/geminiService';

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

  // Assurer l'arrêt de l'audio si on quitte la pièce
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const fetchHoroscope = async (sign: string) => {
    // Si une lecture est en cours, on l'arrête avant d'en lancer une nouvelle
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch(e) {}
    }
    setIsSpeaking(false);

    setSelectedSign(sign);
    setLoading(true);
    setHoroscope('');
    try {
      const res = await getHoroscope(sign);
      setHoroscope(res || '');
      
      // DÉCLENCHEMENT AUTOMATIQUE : La voix de Nostradamus s'élève dès que les astres ont parlé
      if (res) {
        // On passe directement le texte pour éviter d'attendre la mise à jour asynchrone du State
        playNostradamus(res);
      }
    } catch (e) {
      console.error("Erreur lors de la lecture des astres:", e);
    } finally {
      setLoading(false);
    }
  };

  const playNostradamus = async (textOverride?: string) => {
    const textToRead = textOverride || horoscope;
    
    // Si l'utilisateur clique sur le bouton alors que ça parle déjà, on arrête (Toggle manuel)
    if (isSpeaking && !textOverride) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
      setIsSpeaking(false);
      return;
    }

    if (!textToRead) return;

    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Nettoyage avant nouvelle lecture
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }

      const audioData = await generateNostradamusSpeech(textToRead);
      if (audioData) {
        const buffer = await decodeAudioData(
          decodeAudio(audioData),
          audioContextRef.current,
          24000,
          1
        );
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        
        sourceRef.current = source;
        source.start();
        setIsSpeaking(true);
      }
    } catch (e) {
      console.error("L'Oracle Nostradamus est resté muet :", e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const getFullDate = () => {
    return time.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-12 py-6">
      <div className="text-center space-y-4 mb-8 animate-fade">
        <div className="inline-block px-10 py-2 bg-gold-muted/10 border-2 border-gold-bright/20 rounded-full mb-2 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <span className="text-xs font-mystic text-gold-bright uppercase tracking-[0.4em]">
              ✧ Alignement Céleste du {getFullDate()} ✧
            </span>
        </div>
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest drop-shadow-lg">Le Cercle du Zodiaque</h2>
        <p className="text-gold-muted font-cursive text-2xl italic">Les astres vous observent en cet instant précis.</p>
      </div>

      {!selectedSign ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-4">
          {ZODIAC_SIGNS.map((sign) => (
            <button
              key={sign.name}
              onClick={() => fetchHoroscope(sign.name)}
              className="p-8 bg-gradient-to-br from-purple-950/60 to-black/80 border-2 border-gold-muted/20 rounded-2xl hover:border-gold-bright hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all group flex flex-col items-center relative overflow-hidden"
            >
              <span className="absolute -bottom-4 -right-4 text-6xl text-gold-muted/5 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">{sign.symbol}</span>
              
              <span className="block text-6xl mb-6 text-gold-bright group-hover:scale-125 transition-transform duration-700 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] animate-float">
                {sign.symbol}
              </span>
              
              <div className="text-center">
                <span className="block text-xl font-mystic text-gold-bright tracking-widest mb-1">{sign.name}</span>
                <span className="text-[10px] text-gold-muted font-serif uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{sign.dates}</span>
              </div>
              
              <div className="mt-4 w-8 h-[1px] bg-gold-muted/30 group-hover:w-full transition-all duration-500"></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between border-b-2 border-gold-muted/30 pb-6">
            <div className="flex items-center gap-6">
               <span className="text-6xl text-gold-bright drop-shadow-lg">
                 {ZODIAC_SIGNS.find(s => s.name === selectedSign)?.symbol}
               </span>
               <h2 className="text-5xl font-mystic text-gold-bright drop-shadow-lg uppercase tracking-wider">Vision du {selectedSign}</h2>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => playNostradamus()}
                disabled={loading || !horoscope || isAudioLoading}
                className={`flex items-center gap-3 px-6 py-2 border-2 transition-all font-mystic text-xs uppercase tracking-widest rounded-lg ${
                  isSpeaking 
                  ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' 
                  : 'bg-gold-bright/10 border-gold-bright/40 text-gold-bright hover:bg-gold-bright/20'
                }`}
              >
                {isAudioLoading ? (
                  <div className="w-4 h-4 border-2 border-gold-bright/20 border-t-gold-bright rounded-full animate-spin"></div>
                ) : isSpeaking ? (
                  <><span>⏹</span> Nostradamus parle</>
                ) : (
                  <><span>👁️</span> Écouter Nostradamus</>
                )}
              </button>
              <button 
                onClick={() => {
                  if (sourceRef.current) {
                    try { sourceRef.current.stop(); } catch(e) {}
                  }
                  setIsSpeaking(false);
                  setSelectedSign(null);
                }} 
                className="px-6 py-2 border border-gold-muted/40 text-gold-muted hover:text-gold-bright hover:border-gold-bright transition-all font-mystic text-xs uppercase tracking-widest"
              >
                Retour au Cercle
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-32 flex flex-col items-center gap-8">
               <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-gold-muted/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-gold-bright rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">✨</div>
               </div>
               <span className="font-mystic text-gold-bright text-2xl tracking-[0.3em] animate-pulse uppercase">Calcul des Conjonctions...</span>
            </div>
          ) : (
            <div className="glass-mystic gold-border p-12 rounded-[3rem] shadow-3xl relative overflow-hidden min-h-[400px]">
               {isSpeaking && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8 opacity-40">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-gold-bright rounded-full animate-wave" 
                        style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                 </div>
               )}
               
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-9xl">✨</div>
               <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none text-9xl rotate-180">✨</div>
               
               <div className="prose prose-invert max-w-none prose-headings:text-gold-bright prose-p:text-gold-muted text-3xl leading-relaxed whitespace-pre-wrap italic font-serif-elegant mt-8">
                 {horoscope}
               </div>
               
               <div className="mt-16 flex justify-center opacity-40 gap-8">
                  <span className="text-2xl text-gold-bright">☾</span>
                  <span className="text-2xl text-gold-bright">✦</span>
                  <span className="text-2xl text-gold-bright">☽</span>
               </div>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes wave {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-wave {
          animation: wave 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AstrologyRoom;


import React, { useState, useRef, useEffect } from 'react';
import { getPrediction, generateVisionImage, generateSpeech, decodeAudio, decodeAudioData } from '../services/geminiService';

const CrystalBallRoom: React.FC<{ onBack: () => void }> = () => {
  const [step, setStep] = useState<'identity' | 'vision'>('identity');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [query, setQuery] = useState('');
  const [prediction, setPrediction] = useState('');
  const [visionUrl, setVisionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age && birthDate) {
      setStep('vision');
    }
  };

  const playSpeech = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = await generateSpeech(text);
      if (audioData) {
        setIsSpeaking(true);
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
        source.start();
      }
    } catch (e) {
      console.error("Erreur lecture vocale:", e);
      setIsSpeaking(false);
    }
  };

  const handleVision = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPrediction('');
    setVisionUrl(null);
    setIsSpeaking(false);

    try {
      // On s'assure que l'AudioContext est activé par le clic utilisateur
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const p = await getPrediction(query, { age, birthDate });
      setPrediction(p || '');
      
      // On génère l'image et la voix en parallèle
      const [img] = await Promise.all([
        generateVisionImage(p || ''),
        playSpeech(p || '')
      ]);
      
      setVisionUrl(img);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'identity') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-4 animate-fade">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Rituel d'Ouverture</h2>
          <p className="text-gold-muted font-sensual text-3xl italic">L'Oracle doit synchroniser votre fréquence avant la vision.</p>
        </div>

        <form onSubmit={handleIdentitySubmit} className="w-full max-w-md space-y-8 glass-mystic p-10 rounded-[2rem] border-2 border-gold-muted/30 shadow-2xl">
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-mystic text-gold-muted uppercase tracking-[0.3em] mb-3 ml-2">Âge terrestre</label>
              <input 
                type="number" 
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Nombre d'étés vécus..."
                className="w-full bg-black/60 border-2 border-gold-muted/20 p-4 rounded-xl text-gold-bright font-serif focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20"
              />
            </div>

            <div className="group">
              <label className="block text-xs font-mystic text-gold-muted uppercase tracking-[0.3em] mb-3 ml-2">Moment d'Incarnation</label>
              <input 
                type="date" 
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-black/60 border-2 border-gold-muted/20 p-4 rounded-xl text-gold-bright font-serif focus:outline-none focus:border-gold-bright transition-all color-scheme-dark"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-purple-950 to-purple-800 border-2 border-gold-muted text-gold-bright font-mystic text-xl tracking-[0.4em] hover:scale-[1.03] transition-all shadow-[0_0_40px_rgba(184,134,11,0.2)] uppercase rounded-xl"
          >
            S'aligner sur les Astres
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-12 py-8 animate-in fade-in duration-1000">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Miroir de l'Âme</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">L'avenir n'est qu'un reflet qui attend d'être révélé.</p>
      </div>

      {/* Boule de Cristal Immersive */}
      <div className="relative group perspective-1000">
        <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full crystal-container shadow-[0_0_100px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_150px_rgba(139,92,246,0.5)] transition-all duration-1000 z-10">
          
          <div className="absolute inset-0 rounded-full border-[1px] border-white/20 z-30 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-gradient-to-br from-white/40 to-transparent rounded-full blur-md rotate-[-30deg]"></div>
            <div className="absolute bottom-[5%] right-[20%] w-[40%] h-[10%] bg-white/10 rounded-full blur-xl"></div>
          </div>

          <div className="absolute inset-2 rounded-full overflow-hidden bg-black z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.4)_0%,transparent_70%)] animate-swirl-slow"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.3)_0%,transparent_60%)] animate-swirl-medium [animation-delay:-5s]"></div>
            
            {visionUrl && (
              <img 
                src={visionUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-lighten animate-in zoom-in duration-[2000ms]" 
                alt="Vision"
              />
            )}
            
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] z-20 pointer-events-none"></div>
          </div>
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 backdrop-blur-md z-40 animate-fade">
               <div className="relative w-32 h-32">
                 <div className="absolute inset-0 border-4 border-gold-muted/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-t-gold-bright rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl animate-pulse">✨</span>
                 </div>
               </div>
               <span className="font-mystic text-gold-bright text-xl tracking-[0.3em] mt-6 animate-pulse">INCANTATION...</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl space-y-6 z-10 px-4 mt-12">
        <textarea 
          placeholder="De quoi s'inquiète votre âme ? Murmurez-le ici..."
          className="w-full bg-black/60 border-2 border-gold-muted/30 p-6 rounded-2xl text-gold-bright text-2xl font-serif-elegant italic placeholder:text-gold-muted/20 focus:outline-none focus:border-gold-bright focus:shadow-[0_0_30px_rgba(184,134,11,0.2)] transition-all resize-none shadow-inner"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />
        <button 
          onClick={handleVision}
          disabled={loading || !query.trim()}
          className="w-full py-6 bg-gradient-to-r from-purple-950 to-purple-800 border-2 border-gold-muted text-gold-bright font-mystic text-2xl tracking-widest hover:scale-[1.03] hover:from-purple-800 hover:to-purple-700 disabled:opacity-30 transition-all shadow-2xl rounded-xl uppercase relative overflow-hidden group"
        >
          <span className="relative z-10">Fixer l'Abîme</span>
        </button>
      </div>

      {prediction && (
        <div className="max-w-3xl p-10 glass-mystic gold-border rounded-[2rem] animate-in fade-in slide-in-from-top-8 duration-1000 shadow-[0_30px_80px_rgba(0,0,0,1)] mt-4 relative">
          <div className="flex justify-center mb-6 items-center gap-4">
             <span className="text-2xl text-gold-bright opacity-40">✦</span>
             {isSpeaking && (
               <div className="flex items-center gap-1 animate-pulse">
                 <div className="w-1 h-4 bg-gold-bright rounded-full"></div>
                 <div className="w-1 h-6 bg-gold-bright rounded-full"></div>
                 <div className="w-1 h-3 bg-gold-bright rounded-full"></div>
               </div>
             )}
             <span className="text-2xl text-gold-bright opacity-40">✦</span>
          </div>
          <p className="italic text-4xl md:text-5xl text-gold-bright font-sensual leading-relaxed text-center px-4 drop-shadow-md">
            "{prediction}"
          </p>
          {isSpeaking && (
            <div className="mt-4 text-center">
              <span className="text-[10px] font-mystic text-gold-muted uppercase tracking-widest animate-pulse">Cécile vous murmure sa vision...</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes swirl-slow {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes swirl-medium {
          0% { transform: rotate(360deg) scale(1.2); }
          50% { transform: rotate(180deg) scale(1); }
          100% { transform: rotate(0deg) scale(1.2); }
        }
        .animate-swirl-slow {
          animation: swirl-slow 20s linear infinite;
        }
        .animate-swirl-medium {
          animation: swirl-medium 15s linear infinite;
        }
        .crystal-container {
          background: radial-gradient(circle at 30% 30%, #4a0e4e, #1a1510);
        }
      `}</style>
    </div>
  );
};

export default CrystalBallRoom;

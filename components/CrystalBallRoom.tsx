
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
  const [hasGreeted, setHasGreeted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Accueil de la sorcière déclenché immédiatement dès le montage du composant
  useEffect(() => {
    if (!hasGreeted) {
      const greetingText = "Voyageur, approchez ! Dévoilez votre naissance et laissez le miroir déchirer le voile de votre destin !";
      playSpeech(greetingText);
      setHasGreeted(true);
    }
    
    // Cleanup audio on unmount
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const playSpeech = async (text: string) => {
    try {
      // Lancement immédiat de la requête de génération en parallèle de l'init audio
      const audioPromise = generateSpeech(text);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioData = await audioPromise;
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
        
        if (sourceRef.current) {
           try { sourceRef.current.stop(); } catch(e) {}
        }
        sourceRef.current = source;
        source.start();
      }
    } catch (e) {
      console.error("Erreur lecture vocale:", e);
      setIsSpeaking(false);
    }
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age && birthDate) {
      setStep('vision');
    }
  };

  const handleVision = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPrediction('');
    setVisionUrl(null);
    setIsSpeaking(false);

    try {
      // 1. Obtenir la prédiction (rapide)
      const p = await getPrediction(query, { age, birthDate });
      setPrediction(p || '');
      setLoading(false);

      // 2. Lancer la voix et l'image en parallèle
      playSpeech(p || '');
      generateVisionImage(p || '').then(img => setVisionUrl(img));
      
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-700">
      <div className="text-center space-y-2 mb-2">
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Miroir de l'Âme</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">L'avenir n'est qu'un reflet qui attend d'être révélé.</p>
      </div>

      <div className="relative group perspective-1000">
        <div className={`relative w-72 h-72 md:w-80 md:h-80 rounded-full crystal-container transition-all duration-700 z-10 flex items-center justify-center overflow-hidden border-4 ${isSpeaking || visionUrl ? 'border-gold-bright shadow-[0_0_150px_rgba(255,215,0,0.7)]' : 'border-gold-muted/20 shadow-[0_0_80px_rgba(139,92,246,0.3)]'}`}>
          
          <div className="absolute inset-0 rounded-full border-[1px] border-white/10 z-30 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-gradient-to-br from-white/20 to-transparent rounded-full blur-md rotate-[-30deg]"></div>
          </div>

          <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.4)_0%,transparent_70%)] animate-swirl-slow ${isSpeaking || visionUrl ? 'opacity-100 scale-125' : 'opacity-60 scale-100'}`}></div>
            
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[800ms] mix-blend-screen pointer-events-none z-20 ${isSpeaking ? 'opacity-100 scale-115 brightness-[2.5]' : visionUrl ? 'opacity-95 scale-110 brightness-[1.8]' : loading ? 'opacity-70 scale-105' : 'opacity-30 scale-100 blur-[2px]'}`}>
              <svg viewBox="-100 -100 200 200" className="w-full h-full text-purple-100 fill-current">
                 <defs>
                    <radialGradient id="nebulaGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(216, 180, 254, 0.9)" />
                      <stop offset="60%" stopColor="rgba(147, 51, 234, 0.4)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                 </defs>
                 
                 <g className="animate-pulse">
                   <circle cx="0" cy="0" r="85" fill="url(#nebulaGlow)" className={`transition-all duration-700 ${isSpeaking || visionUrl ? 'opacity-90' : 'opacity-40'}`} />
                   
                   <g className="animate-swirl-slow">
                     {[...Array(8)].map((_, i) => (
                       <circle 
                         key={i} 
                         cx={Math.cos(i * 45 * Math.PI / 180) * 40} 
                         cy={Math.sin(i * 45 * Math.PI / 180) * 40} 
                         r={5 + Math.random() * 10} 
                         fill="white" 
                         className="opacity-30 blur-sm"
                       />
                     ))}
                   </g>
                   
                   <circle cx="0" cy="0" r={isSpeaking || visionUrl ? "45" : "15"} fill="white" className={`transition-all duration-500 blur-xl ${isSpeaking || visionUrl ? 'opacity-60' : 'opacity-10'}`} />
                 </g>
              </svg>
            </div>

            {visionUrl && (
              <img 
                src={visionUrl} 
                className={`absolute inset-0 w-full h-full object-cover mix-blend-lighten animate-in zoom-in duration-[1500ms] transition-all duration-700 ${isSpeaking ? 'opacity-100 brightness-125' : 'opacity-60 brightness-100'}`} 
                alt="Vision"
              />
            )}
            
            <div className={`absolute inset-0 rounded-full transition-all duration-700 z-20 pointer-events-none ${isSpeaking || visionUrl ? 'shadow-[inset_0_0_100px_rgba(255,215,0,0.5)]' : 'shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]'}`}></div>
          </div>
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 backdrop-blur-sm z-40 animate-fade">
               <div className="w-12 h-12 border-4 border-gold-muted/20 border-t-gold-bright rounded-full animate-spin"></div>
               <span className="font-mystic text-gold-bright text-xs tracking-[0.2em] mt-4 animate-pulse">VISION...</span>
            </div>
          )}
        </div>
      </div>

      {step === 'identity' ? (
        <form onSubmit={handleIdentitySubmit} className="w-full max-w-sm space-y-6 glass-mystic p-8 rounded-3xl border border-gold-muted/30 shadow-2xl">
          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-mystic text-gold-muted uppercase tracking-[0.3em] mb-1">Âge</label>
              <input 
                type="number" 
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="..."
                className="w-full bg-black/40 border border-gold-muted/20 p-3 rounded-xl text-gold-bright font-serif focus:border-gold-bright transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-[10px] font-mystic text-gold-muted uppercase tracking-[0.3em] mb-1">Naissance</label>
              <input 
                type="date" 
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-black/40 border border-gold-muted/20 p-3 rounded-xl text-gold-bright font-serif focus:border-gold-bright transition-all color-scheme-dark"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-purple-900/40 border border-gold-muted text-gold-bright font-mystic text-sm tracking-[0.3em] hover:bg-purple-800/60 transition-all rounded-xl uppercase">Entrer dans le Cercle</button>
        </form>
      ) : (
        <div className="w-full max-w-lg space-y-4 z-10 px-4">
          <div className="relative">
            <textarea 
              placeholder="Quelle ombre vous tourmente ?"
              className="w-full bg-black/40 border border-gold-muted/20 p-5 rounded-2xl text-gold-bright text-xl font-serif-elegant italic focus:border-gold-bright transition-all resize-none shadow-inner"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
            />
          </div>
          <button 
            onClick={handleVision}
            disabled={loading || !query.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-950 to-purple-800 border border-gold-muted text-gold-bright font-mystic text-lg tracking-[0.2em] hover:scale-[1.02] disabled:opacity-30 transition-all shadow-xl rounded-xl uppercase"
          >
            Fixer l'Abîme
          </button>
          
          {prediction && (
            <div className="p-8 glass-mystic gold-border rounded-3xl animate-in fade-in slide-in-from-top-4 duration-700">
              <p className="italic text-2xl md:text-3xl text-gold-bright font-sensual leading-relaxed text-center drop-shadow-sm">
                "{prediction}"
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes swirl-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-swirl-slow {
          animation: swirl-slow 40s linear infinite;
        }
        .crystal-container {
          background: radial-gradient(circle at 30% 30%, #3a1e4e, #0a0a0a);
          transition: all 0.7s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default CrystalBallRoom;

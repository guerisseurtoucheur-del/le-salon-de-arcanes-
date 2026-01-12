
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

  // Accueil de la sorcière instantané dès l'entrée
  useEffect(() => {
    if (!hasGreeted) {
      playGreeting();
      setHasGreeted(true);
    }
  }, [hasGreeted]);

  const playGreeting = async () => {
    const greetingText = "Approchez, n'ayez crainte. Le miroir de l'âme est prêt. Dites-moi votre âge et votre date de naissance pour que les brumes se dissipent.";
    await playSpeech(greetingText);
  };

  const playSpeech = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
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
      // 1. Obtenir la prédiction (très rapide avec flash)
      const p = await getPrediction(query, { age, birthDate });
      setPrediction(p || '');
      setLoading(false); // On enlève le loader dès qu'on a le texte

      // 2. Lancer la voix et l'image en parallèle, mais sans bloquer l'affichage
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
        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full crystal-container shadow-[0_0_80px_rgba(139,92,246,0.3)] z-10 flex items-center justify-center overflow-hidden border-4 border-gold-muted/20">
          
          {/* Reflets de surface */}
          <div className="absolute inset-0 rounded-full border-[1px] border-white/10 z-30 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-gradient-to-br from-white/20 to-transparent rounded-full blur-md rotate-[-30deg]"></div>
          </div>

          <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
            {/* Swirl de fond */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.3)_0%,transparent_70%)] animate-swirl-slow"></div>
            
            {/* VISAGE DE LA SORCIÈRE - PARFAITEMENT CENTRÉ AVEC CHEVEUX */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1000ms] mix-blend-screen pointer-events-none z-20 ${isSpeaking || loading ? 'opacity-90 scale-105' : 'opacity-20 scale-100 blur-[2px]'}`}>
              <svg viewBox="-100 -100 200 200" className="w-full h-full text-purple-100 fill-current filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                 <defs>
                    <radialGradient id="witchGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(216, 180, 254, 0.6)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                 </defs>
                 
                 <g className="animate-witch-float">
                   {/* Aura centrale */}
                   <circle cx="0" cy="0" r="70" fill="url(#witchGlow)" className="animate-pulse opacity-20" />
                   
                   {/* CHEVELURE SPECTRALE (Statique mais vaporeuse) */}
                   <g opacity="0.4" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round">
                     {/* Mèches gauche */}
                     <path d="M-35 -50 C-80 -40 -90 20 -70 80" />
                     <path d="M-40 -40 C-70 -30 -80 10 -60 60" />
                     <path d="M-30 -60 C-50 -80 -70 -50 -75 -20" />
                     {/* Mèches droite */}
                     <path d="M35 -50 C80 -40 90 20 70 80" />
                     <path d="M40 -40 C70 -30 80 10 60 60" />
                     <path d="M30 -60 C50 -80 70 -50 75 -20" />
                     {/* Sommet */}
                     <path d="M-20 -65 Q0 -90 20 -65" />
                   </g>

                   {/* VISAGE (Bouche statique) */}
                   <path d="M-35 -40 C-50 -15 -45 50 0 65 C45 50 50 -15 35 -40 C25 -70 -25 -70 -35 -40 Z" 
                         fill="rgba(147, 51, 234, 0.15)" stroke="rgba(216, 180, 254, 0.4)" strokeWidth="0.8" />
                   
                   {/* Yeux d'or fixes */}
                   <g>
                     <ellipse cx="-16" cy="-15" rx="9" ry="12" fill="rgba(0,0,0,0.6)" />
                     <ellipse cx="16" cy="-15" rx="9" ry="12" fill="rgba(0,0,0,0.6)" />
                     <circle cx="-16" cy="-15" r="2.5" fill="#ffd700" className="blur-[1px] opacity-80" />
                     <circle cx="16" cy="-15" r="2.5" fill="#ffd700" className="blur-[1px] opacity-80" />
                   </g>
                   
                   {/* Nez crochu */}
                   <path d="M0 -10 Q15 8 0 22" fill="none" stroke="rgba(216, 180, 254, 0.6)" strokeWidth="2" strokeLinecap="round" />
                   
                   {/* Bouche statique (Simple trait mystérieux) */}
                   <path d="M-12 42 Q0 48 12 42" fill="none" stroke="rgba(216, 180, 254, 0.7)" strokeWidth="2" strokeLinecap="round" />
                 </g>
              </svg>
            </div>

            {/* Vision Image */}
            {visionUrl && (
              <img 
                src={visionUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-lighten animate-in zoom-in duration-[1500ms]" 
                alt="Vision"
              />
            )}
            
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] z-20 pointer-events-none"></div>
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
        @keyframes witch-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(0.3deg); }
        }
        .animate-swirl-slow {
          animation: swirl-slow 40s linear infinite;
        }
        .animate-witch-float {
          animation: witch-float 8s ease-in-out infinite;
        }
        .crystal-container {
          background: radial-gradient(circle at 30% 30%, #3a1e4e, #0a0a0a);
        }
      `}</style>
    </div>
  );
};

export default CrystalBallRoom;


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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleVision = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPrediction('');
    setVisionUrl(null);
    setIsSpeaking(false);

    try {
      const p = await getPrediction(query, { age, birthDate });
      setPrediction(p || '');
      setLoading(false);
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

      <div 
        className="relative group perspective-1000 cursor-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      >
        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full crystal-container shadow-[0_0_80px_rgba(139,92,246,0.3)] z-10 flex items-center justify-center overflow-hidden border-4 border-gold-muted/20">
          
          {/* Reflets de surface fixes */}
          <div className="absolute inset-0 rounded-full border-[1px] border-white/10 z-30 pointer-events-none overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-gradient-to-br from-white/20 to-transparent rounded-full blur-md rotate-[-30deg]"></div>
          </div>

          <div className="absolute inset-0 bg-[#050010] z-10 flex items-center justify-center">
            {/* FLUX INTERNES INTERACTIFS */}
            <div 
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
            >
              {/* Nébuleuse 1 */}
              <div className="absolute inset-[-20%] bg-[radial-gradient(circle_at_50%_50%,#7e22ce_0%,transparent_60%)] opacity-30 animate-pulse"></div>
              {/* Nébuleuse 2 */}
              <div 
                className="absolute inset-[-20%] bg-[radial-gradient(circle_at_40%_60%,#3b82f6_0%,transparent_50%)] opacity-20 animate-swirl-slow"
                style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
              ></div>
              {/* Particules de brume */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen animate-pulse"></div>
            </div>

            {/* Cœur énergétique */}
            <div className={`absolute w-32 h-32 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000 ${isSpeaking || loading ? 'scale-150 opacity-100' : 'scale-100 opacity-40'}`}></div>

            {/* Vision Image (Apparaît au centre) */}
            {visionUrl && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <img 
                  src={visionUrl} 
                  className="w-full h-full object-cover opacity-60 mix-blend-lighten animate-in zoom-in duration-[2000ms] rounded-full" 
                  alt="Vision"
                />
              </div>
            )}
            
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] z-25 pointer-events-none"></div>
          </div>
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 backdrop-blur-sm z-40 animate-fade">
               <div className="w-12 h-12 border-4 border-gold-muted/20 border-t-gold-bright rounded-full animate-spin"></div>
               <span className="font-mystic text-gold-bright text-xs tracking-[0.2em] mt-4 animate-pulse">INCANTATION...</span>
            </div>
          )}
        </div>

        {/* Halo externe interactif */}
        <div 
          className="absolute inset-[-40px] rounded-full bg-purple-600/5 blur-[60px] pointer-events-none transition-transform duration-500 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)` }}
        ></div>
      </div>

      {step === 'identity' ? (
        <form onSubmit={handleIdentitySubmit} className="w-full max-w-sm space-y-6 glass-mystic p-8 rounded-3xl border border-gold-muted/30 shadow-2xl relative z-50">
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
          <button type="submit" className="w-full py-4 bg-purple-900/40 border border-gold-muted text-gold-bright font-mystic text-sm tracking-[0.3em] hover:bg-purple-800/60 transition-all rounded-xl uppercase">Sonder mon destin</button>
        </form>
      ) : (
        <div className="w-full max-w-lg space-y-4 z-50 px-4">
          <div className="relative">
            <textarea 
              placeholder="Que voulez-vous savoir ?"
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
            Appeler la Vision
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
          0% { transform: rotate(0deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1.2); }
        }
        .animate-swirl-slow {
          animation: swirl-slow 20s linear infinite;
        }
        .crystal-container {
          background: radial-gradient(circle at 30% 30%, #1e1b4b, #0a0a0a);
        }
      `}</style>
    </div>
  );
};

export default CrystalBallRoom;

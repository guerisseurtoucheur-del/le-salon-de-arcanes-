
import React, { useState, useEffect, useRef } from 'react';
import { getPendulumResponse } from '../services/geminiService';

const DecorativeCardBack: React.FC<{ className?: string, symbol?: string, delay?: string }> = ({ className, symbol = "👁️", delay = "0s" }) => (
  <div className={`relative overflow-hidden rounded-sm border-[3px] border-gold-muted/50 bg-velvet-deep shadow-[0_10px_40px_rgba(0,0,0,0.8)] ${className}`}>
    <div className="absolute inset-2 border border-gold-bright/30 flex flex-col items-center justify-center">
       <div className="relative">
         <span className="text-5xl text-gold-bright drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">{symbol}</span>
         <div 
          className="absolute inset-0 scale-[1.8] border border-dashed border-gold-bright/40 rounded-full animate-[spin_15s_linear_infinite]"
          style={{ animationDelay: delay }}
         ></div>
       </div>
       <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,transparent_70%)]"></div>
       <div className="text-[10px] font-mystic text-gold-bright/40 tracking-[0.2em] uppercase text-center px-4 leading-tight mt-10">
         Arcana Mundi • Veritas Invenietur • Fati Constans
       </div>
    </div>
    <div className="absolute inset-0 bg-black/20 opacity-20 mix-blend-overlay"></div>
  </div>
);

const PendulumRoom: React.FC<{ onBack: () => void }> = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<{answer: string, reason: string} | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [rotationClass, setRotationClass] = useState('');
  
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);

  // Gestion du son Tik-Tak synchronisé avec le balancement
  useEffect(() => {
    if (!tickAudioRef.current) {
      // Utilisation d'un son de métronome mécanique ou tik-tak
      tickAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3');
      tickAudioRef.current.loop = true;
      tickAudioRef.current.volume = 0.25;
    }

    if (isSwinging) {
      // On essaye de jouer le son quand le pendule cherche
      tickAudioRef.current.play().catch(e => console.warn("Audio bloqué par le navigateur:", e));
    } else {
      // On arrête le son dès que le pendule se fixe
      tickAudioRef.current.pause();
      tickAudioRef.current.currentTime = 0;
    }

    return () => {
      tickAudioRef.current?.pause();
    };
  }, [isSwinging]);

  const askPendulum = async () => {
    if (!question.trim()) return;
    
    setResult(null);
    setRotationClass('');
    setIsSwinging(true);
    
    try {
      const pendulumTask = getPendulumResponse(question);
      const timerTask = new Promise(resolve => setTimeout(resolve, 4000));
      
      const [res] = await Promise.all([pendulumTask, timerTask]);
      
      setIsSwinging(false);
      setResult(res);
      
      const answer = res.answer.toUpperCase();
      if (answer.includes('OUI')) {
        setRotationClass('rotate-[35deg]');
      } else if (answer.includes('NON')) {
        setRotationClass('rotate-[-35deg]');
      } else {
        setRotationClass('rotate-0');
      }
    } catch (e) {
      console.error(e);
      setIsSwinging(false);
      setRotationClass('');
    }
  };

  const reset = () => {
    setResult(null);
    setQuestion('');
    setIsSwinging(false);
    setRotationClass('');
  };

  return (
    <div className="flex flex-col items-center gap-12 py-10 overflow-hidden min-h-[90vh] relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#0a050d] opacity-90 shadow-inner">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] mix-blend-overlay opacity-30"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
        </div>
        <DecorativeCardBack symbol="🌙" className="absolute top-20 left-[-40px] w-48 h-80 rotate-[-15deg] opacity-20 blur-[2px] scale-90" />
        <DecorativeCardBack symbol="🗝️" className="absolute bottom-20 right-[-20px] w-52 h-84 rotate-[15deg] opacity-50 blur-0 scale-105 z-10" />
      </div>

      <div className="text-center max-w-lg space-y-4 animate-fade z-50">
        <h2 className="text-4xl md:text-5xl font-mystic text-gold-bright tracking-[0.3em] uppercase drop-shadow-lg">Le Sanctuaire des Vérités</h2>
        <p className="text-gold-muted font-serif italic text-xl">Le cristal capte les échos de votre destinée.</p>
      </div>

      <div className="relative h-[600px] w-full flex flex-col items-center pendulum-anchor mt-4">
        <div className="w-32 h-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent rounded-full relative z-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-gold-bright bg-velvet-deep flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.6)]">
             <div className="w-4 h-4 bg-gold-bright rounded-full animate-pulse"></div>
          </div>
        </div>

        <div 
          className={`pendulum-arm absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 origin-top ${
            isSwinging ? 'animate-swing-wide' : (result ? rotationClass : 'animate-swing-subtle')
          }`}
          style={{ 
            top: '0px',
            transition: 'transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)' 
          }}
        >
          <div className="w-[8px] h-[400px] flex flex-col items-center relative">
            <div className="w-[2px] h-full bg-gold-muted/40 absolute left-1/2 -translate-x-1/2"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.8)_20%,transparent_30%)] bg-[length:8px_12px]"></div>
          </div>
          <div className="relative -mt-1 group">
             <div className="relative z-10 drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
                <svg width="70" height="110" viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M35 0L70 40L55 90L35 110L15 90L0 40L35 0Z" fill="url(#crystal_grad)" stroke="#1a1510" strokeWidth="1"/>
                  <path d="M35 0V110" stroke="white" strokeOpacity="0.4" strokeWidth="0.5"/>
                  <defs>
                    <linearGradient id="crystal_grad" x1="0" y1="0" x2="70" y2="110" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" stopOpacity="0.9"/>
                      <stop offset="0.4" stopColor="#fdf6e3" stopOpacity="0.6"/>
                      <stop offset="1" stopColor="#b8860b" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                </svg>
             </div>
          </div>
        </div>
        
        <div className={`absolute bottom-4 w-full max-w-4xl flex justify-between px-24 font-mystic text-6xl tracking-[0.5em] pointer-events-none select-none`}>
          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('NON') ? 'text-red-500 opacity-100 scale-125' : 'opacity-10 text-gold-muted'}`}>NON</span>
          </div>
          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('OUI') ? 'text-green-500 opacity-100 scale-125' : 'opacity-10 text-gold-muted'}`}>OUI</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-6 z-40 px-6 mt-[-40px]">
        {!result && !isSwinging && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <input 
              type="text"
              placeholder="Ex: Mon voyage sera-t-il propice ?"
              className="w-full bg-black/95 border-2 border-gold-muted/40 p-8 rounded-[2rem] text-gold-bright text-2xl font-serif italic focus:outline-none focus:border-gold-bright transition-all shadow-2xl mb-10"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && askPendulum()}
            />
            <button 
              onClick={askPendulum}
              disabled={!question.trim()}
              className="w-full py-8 px-10 bg-gradient-to-r from-purple-950 via-purple-900 to-black border-2 border-gold-muted text-gold-bright font-mystic text-xl tracking-[0.3em] hover:scale-[1.05] transition-all rounded-xl uppercase shadow-xl"
            >
              Interroger le Pendule
            </button>
          </div>
        )}

        {isSwinging && (
          <div className="text-center space-y-6 animate-pulse p-12 bg-black/60 rounded-[3rem] backdrop-blur-xl border border-gold-muted/30">
            <p className="font-mystic text-gold-bright text-3xl tracking-[0.5em] uppercase">Capture des Vibrations...</p>
          </div>
        )}

        {result && (
          <div className="text-center space-y-10 animate-in zoom-in-95 duration-700 p-14 glass-mystic gold-border rounded-[4rem] relative overflow-hidden shadow-2xl">
            <h3 className={`text-8xl md:text-9xl font-mystic mb-4 tracking-[0.6em] ${
              result.answer.includes('OUI') ? 'text-green-500' : result.answer.includes('NON') ? 'text-red-500' : 'text-gold-bright'
            }`}>
              {result.answer}
            </h3>
            <p className="italic text-4xl md:text-5xl text-gold-muted font-cursive leading-relaxed px-10">"{result.reason}"</p>
            <button onClick={reset} className="mt-10 px-16 py-5 rounded-full border-2 border-gold-muted/50 text-gold-muted hover:text-gold-bright hover:border-gold-bright transition-all font-mystic text-xl uppercase tracking-[0.4em]">Nouvelle Vision</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes swing-wide {
          0% { transform: rotate(-30deg); }
          100% { transform: rotate(30deg); }
        }
        @keyframes swing-subtle {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        .animate-swing-wide {
          animation: swing-wide 1.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
        }
        .animate-swing-subtle {
          animation: swing-subtle 3s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default PendulumRoom;

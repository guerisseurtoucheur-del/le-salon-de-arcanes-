
import React, { useState, useEffect } from 'react';
import { getPendulumResponse } from '../services/geminiService';

const DecorativeCardBack: React.FC<{ className?: string, symbol?: string, delay?: string }> = ({ className, symbol = "👁️", delay = "0s" }) => (
  <div className={`relative overflow-hidden rounded-sm border-[3px] border-gold-muted/50 bg-velvet-deep shadow-[0_10px_40px_rgba(0,0,0,0.8)] ${className}`}>
    {/* Ornate Frame */}
    <div className="absolute inset-2 border border-gold-bright/30 flex flex-col items-center justify-center">
       {/* LES BARRES DES COINS ONT ÉTÉ SUPPRIMÉES ICI */}
       
       {/* Central Symbol */}
       <div className="relative">
         <span className="text-5xl text-gold-bright drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">{symbol}</span>
         <div 
          className="absolute inset-0 scale-[1.8] border border-dashed border-gold-bright/40 rounded-full animate-[spin_15s_linear_infinite]"
          style={{ animationDelay: delay }}
         ></div>
         <div 
          className="absolute inset-0 scale-[2.2] border border-dotted border-gold-muted/20 rounded-full animate-[spin_25s_linear_infinite_reverse]"
          style={{ animationDelay: delay }}
         ></div>
       </div>

       {/* Mystical Textures */}
       <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.15)_0%,transparent_70%)]"></div>
       
       <div className="text-[10px] font-mystic text-gold-bright/40 tracking-[0.2em] uppercase text-center px-4 leading-tight mt-10">
         Arcana Mundi • Veritas Invenietur • Fati Constans
       </div>
    </div>
    
    {/* Texture rayée (pinstriped) supprimée pour éviter l'effet "barres" */}
    <div className="absolute inset-0 bg-black/20 opacity-20 mix-blend-overlay"></div>
  </div>
);

const PendulumRoom: React.FC<{ onBack: () => void }> = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<{answer: string, reason: string} | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [rotationClass, setRotationClass] = useState('');

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
      {/* Cinematic Table Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dark Velvet Texture */}
        <div className="absolute inset-0 bg-[#0a050d] opacity-90 shadow-inner">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] mix-blend-overlay opacity-30"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
        </div>
        
        {/* Scattered Tarot Cards */}
        <DecorativeCardBack 
          symbol="🌙"
          className="absolute top-20 left-[-40px] w-48 h-80 rotate-[-15deg] opacity-20 blur-[2px] scale-90" 
        />
        
        {/* Right Side Cluster */}
        <DecorativeCardBack 
          symbol="🔯"
          className="absolute top-10 right-10 w-52 h-84 rotate-[10deg] opacity-40 blur-[0.5px] scale-100 z-10" 
          delay="-2s"
        />
        <DecorativeCardBack 
          symbol="🪐"
          className="absolute top-40 right-[-30px] w-48 h-80 rotate-[-5deg] opacity-35 blur-[1px] scale-95" 
          delay="-5s"
        />
        <DecorativeCardBack 
          symbol="🗝️"
          className="absolute bottom-20 right-[-20px] w-52 h-84 rotate-[15deg] opacity-50 blur-0 scale-105 z-10" 
          delay="-8s"
        />
        <DecorativeCardBack 
          symbol="⚖️"
          className="absolute bottom-[-60px] right-[150px] w-48 h-80 rotate-[-12deg] opacity-30 blur-[1px] scale-90" 
          delay="-12s"
        />
        
        {/* Candlelight Warmth */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[150px] animate-pulse [animation-delay:1s]"></div>
      </div>

      <div className="text-center max-w-lg space-y-4 animate-fade z-50">
        <h2 className="text-4xl md:text-5xl font-mystic text-gold-bright tracking-[0.3em] uppercase drop-shadow-lg">Le Sanctuaire des Vérités</h2>
        <p className="text-gold-muted font-serif italic text-xl">Le cristal capte les échos de votre destinée.</p>
      </div>

      {/* Realistic Pendulum Area */}
      <div className="relative h-[600px] w-full flex flex-col items-center pendulum-anchor mt-4">
        
        {/* Support Hook */}
        <div className="w-32 h-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent rounded-full relative z-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-gold-bright bg-velvet-deep flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.6)]">
             <div className="w-4 h-4 bg-gold-bright rounded-full animate-pulse shadow-[0_0_10px_gold]"></div>
          </div>
        </div>

        {/* Pendulum Arm */}
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
             <div className={`absolute inset-0 w-48 h-56 -left-16 -top-12 blur-[70px] rounded-full transition-all duration-1000 ${
               isSwinging ? 'bg-gold-bright opacity-40 scale-150 animate-pulse' : 
               result?.answer.includes('OUI') ? 'bg-green-500 opacity-50 scale-125' :
               result?.answer.includes('NON') ? 'bg-red-500 opacity-50 scale-125' : 
               'bg-purple-500 opacity-20'
             }`}></div>
             
             <div className="relative z-10 drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
                <svg width="70" height="110" viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M35 0L70 40L55 90L35 110L15 90L0 40L35 0Z" fill="url(#crystal_grad)" stroke="#1a1510" strokeWidth="1"/>
                  <path d="M35 0V110" stroke="white" strokeOpacity="0.4" strokeWidth="0.5"/>
                  <path d="M0 40L70 40" stroke="white" strokeOpacity="0.3" strokeWidth="0.5"/>
                  <path d="M15 90L55 90" stroke="white" strokeOpacity="0.3" strokeWidth="0.5"/>
                  <path d="M35 0L15 90M35 0L55 90" stroke="white" strokeOpacity="0.2" strokeWidth="0.5"/>
                  <path d="M0 40L35 110L70 40" stroke="white" strokeOpacity="0.2" strokeWidth="0.5"/>
                  <path d="M10 35L25 15" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="50" cy="50" r="3" fill="white" fillOpacity="0.6" className="animate-pulse"/>
                  <defs>
                    <linearGradient id="crystal_grad" x1="0" y1="0" x2="70" y2="110" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" stopOpacity="0.9"/>
                      <stop offset="0.4" stopColor="#fdf6e3" stopOpacity="0.6"/>
                      <stop offset="0.7" stopColor="#dccba0" stopOpacity="0.7"/>
                      <stop offset="1" stopColor="#b8860b" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                </svg>
             </div>
          </div>
        </div>
        
        {/* Shadow */}
        <div className="absolute bottom-12 w-full flex justify-center pointer-events-none">
           <div className={`w-32 h-8 bg-black/80 rounded-full blur-3xl transition-all duration-500 ${
             isSwinging ? 'animate-shadow-swing' : 
             result?.answer.includes('OUI') ? 'translate-x-[120px] opacity-70 scale-x-125' :
             result?.answer.includes('NON') ? 'translate-x-[-120px] opacity-70 scale-x-125' : 
             'opacity-30 scale-x-100'
           }`}></div>
        </div>

        {/* OUI / NON Indicators */}
        <div className={`absolute bottom-4 w-full max-w-4xl flex justify-between px-24 font-mystic text-6xl tracking-[0.5em] pointer-events-none select-none`}>
          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('NON') ? 'text-red-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]' : 'opacity-10 text-gold-muted'}`}>NON</span>
            <div className={`w-8 h-8 rounded-full transition-all duration-1000 ${result?.answer.includes('NON') ? 'bg-red-500 scale-150 shadow-[0_0_25px_red]' : 'bg-gold-muted/20'}`}></div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('OUI') ? 'text-green-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]' : 'opacity-10 text-gold-muted'}`}>OUI</span>
            <div className={`w-8 h-8 rounded-full transition-all duration-1000 ${result?.answer.includes('OUI') ? 'bg-green-500 scale-150 shadow-[0_0_25px_green]' : 'bg-gold-muted/20'}`}></div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-2xl space-y-6 z-40 px-6 mt-[-40px]">
        {!result && !isSwinging && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative group mb-10">
              <input 
                type="text"
                placeholder="Ex: Mon voyage sera-t-il propice ?"
                className="w-full bg-black/95 border-2 border-gold-muted/40 p-8 rounded-[2rem] text-gold-bright text-2xl font-serif italic focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askPendulum()}
              />
              <div className="absolute -inset-3 bg-gradient-to-r from-purple-600/0 via-gold-bright/10 to-purple-600/0 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            </div>
            <button 
              onClick={askPendulum}
              disabled={!question.trim()}
              className="w-full py-8 px-10 bg-gradient-to-r from-purple-950 via-purple-900 to-black border-2 border-gold-muted text-gold-bright font-mystic text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.3em] hover:scale-[1.05] active:scale-95 transition-all duration-500 disabled:opacity-30 shadow-[0_0_50px_rgba(59,7,100,0.6)] uppercase flex items-center justify-center text-center leading-tight rounded-xl"
            >
              Interroger le Pendule de Cristal
            </button>
          </div>
        )}

        {isSwinging && (
          <div className="text-center space-y-10 animate-pulse p-12 bg-black/60 rounded-[3rem] backdrop-blur-xl border border-gold-muted/30 shadow-3xl">
            <p className="font-mystic text-gold-bright text-3xl tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">Capture des Vibrations...</p>
            <div className="flex justify-center gap-8">
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {result && (
          <div className="text-center space-y-10 animate-in zoom-in-95 duration-700 p-14 glass-mystic gold-border rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 ${result.answer.includes('OUI') ? 'bg-green-600' : 'bg-red-600'}`}></div>
            <h3 className={`text-8xl md:text-9xl font-mystic mb-4 tracking-[0.6em] transition-colors duration-1000 ${
              result.answer.includes('OUI') ? 'text-green-500' : result.answer.includes('NON') ? 'text-red-500' : 'text-gold-bright'
            }`}>
              {result.answer}
            </h3>
            <p className="italic text-4xl md:text-5xl text-gold-muted font-cursive leading-relaxed px-10">"{result.reason}"</p>
            <button onClick={reset} className="mt-10 px-16 py-5 rounded-full border-2 border-gold-muted/50 text-gold-muted hover:text-gold-bright hover:border-gold-bright hover:bg-gold-bright/20 transition-all font-mystic text-xl uppercase tracking-[0.4em]">Nouvelle Vision</button>
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
        @keyframes shadow-swing {
          0% { transform: translateX(-100px) scaleX(1.4); opacity: 0.5; }
          100% { transform: translateX(100px) scaleX(1.4); opacity: 0.5; }
        }
        .animate-swing-wide {
          animation: swing-wide 1.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
        }
        .animate-swing-subtle {
          animation: swing-subtle 3s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
        }
        .animate-shadow-swing {
          animation: shadow-swing 1.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default PendulumRoom;

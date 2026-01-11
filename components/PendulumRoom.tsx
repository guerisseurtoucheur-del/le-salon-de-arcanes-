
import React, { useState } from 'react';
import { getPendulumResponse } from '../services/geminiService';

const PendulumRoom: React.FC<{ onBack: () => void }> = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<{answer: string, reason: string} | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  const [rotationClass, setRotationClass] = useState('');

  const askPendulum = async () => {
    if (!question.trim()) return;
    
    // Phase 1 : Le pendule descend et s'illumine
    setIsDropped(true);
    setIsSwinging(true);
    setResult(null);
    setRotationClass('swing-active');
    
    try {
      // On interroge Gemini tout en laissant l'animation se dérouler
      const [res] = await Promise.all([
        getPendulumResponse(question),
        new Promise(resolve => setTimeout(resolve, 4500)) // Temps minimum de balancement pour l'immersion
      ]);
      
      // Phase 2 : La réponse arrive, le pendule s'arrête net sur le OUI ou le NON
      setResult(res);
      setIsSwinging(false);
      
      const answer = res.answer.toUpperCase();
      if (answer.includes('OUI')) {
        setRotationClass('rotate-[45deg]');
      } else if (answer.includes('NON')) {
        setRotationClass('rotate-[-45deg]');
      } else {
        setRotationClass('rotate-0');
      }
    } catch (e) {
      console.error(e);
      setIsSwinging(false);
      setIsDropped(false);
      setRotationClass('');
    }
  };

  const reset = () => {
    setResult(null);
    setQuestion('');
    setIsSwinging(false);
    setIsDropped(false);
    setRotationClass('');
  };

  return (
    <div className="flex flex-col items-center gap-12 py-10 overflow-hidden min-h-[90vh] relative">
      <div className="text-center max-w-lg space-y-4 animate-fade z-50">
        <h2 className="text-4xl md:text-5xl font-mystic text-gold-bright tracking-[0.3em] uppercase drop-shadow-lg">Le Sanctuaire des Vérités</h2>
        <p className="text-gold-muted font-serif italic text-xl">L'invisible attend votre appel pour se manifester.</p>
      </div>

      {/* Realistic Pendulum Component */}
      <div className="relative h-[600px] w-full flex flex-col items-center pendulum-anchor mt-8">
        
        {/* Support Hook (Attaché au plafond invisible) */}
        <div className="w-32 h-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent rounded-full relative z-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-gold-bright bg-velvet-deep flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.6)]">
             <div className="w-3 h-3 bg-gold-bright rounded-full animate-pulse shadow-[0_0_10px_gold]"></div>
          </div>
        </div>

        {/* Pendulum Arm (String + Weight) */}
        <div 
          className={`pendulum-arm absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 ${rotationClass || (isDropped ? '' : 'swing-subtle')}`}
          style={{ top: isDropped ? '0px' : '-200px', transition: 'top 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 2s ease-out' }}
        >
          {/* The String (Chaîne d'or très longue) */}
          <div className="w-[3px] h-[420px] bg-gradient-to-b from-gold-muted via-gold-bright to-gold-muted shadow-[0_0_15px_rgba(255,215,0,0.4)] relative">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_4px,rgba(255,255,255,0.2)_5px,transparent_6px)]"></div>
          </div>
          
          {/* The Crystal Weight */}
          <div className="relative -mt-2">
             {/* Halo de puissance qui s'allume lors du balancement */}
             <div className={`absolute inset-0 w-40 h-48 -left-12 -top-12 blur-[50px] rounded-full transition-all duration-1000 ${
               isSwinging ? 'bg-gold-bright opacity-60 scale-150 animate-pulse' : 
               result?.answer.includes('OUI') ? 'bg-green-500 opacity-50 scale-125' :
               result?.answer.includes('NON') ? 'bg-red-500 opacity-50 scale-125' : 
               isDropped ? 'bg-gold-muted opacity-20' : 'bg-transparent opacity-0'
             }`}></div>
             
             {/* Physical Crystal */}
             <div className={`pendulum-weight w-16 h-24 relative z-10 flex items-center justify-center transition-all duration-500 ${isSwinging ? 'crystal-glow-active' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-full opacity-60 bg-[url('https://www.transparenttextures.com/patterns/glass-shattered.png')]"></div>
                <div className="absolute inset-3 bg-gradient-to-tr from-white/30 to-transparent rounded-full blur-md"></div>
                <div className="absolute top-4 left-4 w-4 h-8 bg-white/70 blur-[2px] rounded-full rotate-12"></div>
             </div>
          </div>
        </div>
        
        {/* Dynamic Shadow on the floor */}
        <div className="absolute bottom-12 w-full flex justify-center pointer-events-none">
           <div className={`w-24 h-8 bg-black/90 rounded-full blur-2xl transition-all duration-300 ${
             isSwinging ? 'animate-[shadow-move_0.9s_infinite_alternate]' : 
             result?.answer.includes('OUI') ? 'translate-x-[80px] opacity-50 scale-x-125' :
             result?.answer.includes('NON') ? 'translate-x-[-80px] opacity-50 scale-x-125' : 
             isDropped ? 'opacity-30 scale-x-100' : 'opacity-0'
           }`}></div>
        </div>

        {/* Labels OUI / NON au sol */}
        <div className={`absolute bottom-4 w-full max-w-3xl flex justify-between px-20 font-mystic text-6xl tracking-[0.4em] pointer-events-none select-none transition-opacity duration-1000 ${isDropped ? 'opacity-100' : 'opacity-10'}`}>
          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('NON') ? 'text-red-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] brightness-150' : 'opacity-20 text-gold-muted'}`}>NON</span>
            <div className={`w-6 h-6 rounded-full transition-all duration-1000 ${result?.answer.includes('NON') ? 'bg-red-500 scale-150 shadow-[0_0_20px_red]' : 'bg-gold-muted/20'}`}></div>
          </div>

          <div className="self-center h-[3px] w-64 bg-gradient-to-r from-transparent via-gold-muted/30 to-transparent"></div>

          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('OUI') ? 'text-green-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)] brightness-150' : 'opacity-20 text-gold-muted'}`}>OUI</span>
            <div className={`w-6 h-6 rounded-full transition-all duration-1000 ${result?.answer.includes('OUI') ? 'bg-green-500 scale-150 shadow-[0_0_20px_green]' : 'bg-gold-muted/20'}`}></div>
          </div>
        </div>
      </div>

      {/* Interaction Area */}
      <div className="w-full max-w-xl space-y-6 z-40 px-6 mt-[-40px]">
        {!result && !isSwinging && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative group mb-8">
              <input 
                type="text"
                placeholder="Quelle vérité cherchez-vous ?"
                className="w-full bg-black/80 border-2 border-gold-muted/40 p-7 rounded-3xl text-gold-bright text-3xl font-serif italic focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20 shadow-[0_15px_50px_rgba(0,0,0,0.7)]"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askPendulum()}
              />
              <div className="absolute -inset-2 bg-gradient-to-r from-gold-muted/0 via-gold-bright/15 to-gold-muted/0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            </div>
            <button 
              onClick={askPendulum}
              disabled={!question.trim()}
              className="w-full py-7 px-8 bg-gradient-to-r from-red-950 to-black border-2 border-gold-muted text-gold-bright font-mystic text-2xl md:text-3xl tracking-[0.2em] md:tracking-[0.4em] hover:from-red-900 hover:to-velvet-red hover:scale-[1.04] active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_40px_rgba(74,4,4,0.5)] uppercase flex items-center justify-center text-center"
            >
              Quelle question sur votre avenir vous posez-vous ?
            </button>
          </div>
        )}

        {isSwinging && (
          <div className="text-center space-y-8 animate-pulse p-10 bg-black/40 rounded-[3rem] backdrop-blur-md border border-gold-muted/20 shadow-2xl">
            <p className="font-mystic text-gold-bright text-3xl tracking-[0.5em] uppercase drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">Le destin s'écrit...</p>
            <div className="flex justify-center gap-6">
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-duration:0.8s]"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.8s]"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.8s]"></div>
            </div>
          </div>
        )}

        {result && (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-700 p-12 glass-mystic gold-border rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-15 pointer-events-none ${result.answer.includes('OUI') ? 'bg-green-600' : 'bg-red-600'}`}></div>
            
            <div className="relative inline-block">
               <h3 className={`text-9xl font-mystic mb-6 tracking-[0.5em] drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] ${
                 result.answer.includes('OUI') ? 'text-green-500' : result.answer.includes('NON') ? 'text-red-500' : 'text-gold-bright'
               }`}>
                 {result.answer}
               </h3>
               <div className={`h-1.5 w-full bg-gradient-to-r from-transparent via-${result.answer.includes('OUI') ? 'green-500' : 'red-500'}/50 to-transparent`}></div>
            </div>
            
            <p className="italic text-4xl text-gold-muted font-cursive leading-relaxed px-8 drop-shadow-md">
              "{result.reason}"
            </p>
            
            <button 
              onClick={reset}
              className="mt-8 px-14 py-4 rounded-full border-2 border-gold-muted/40 text-gold-muted hover:text-gold-bright hover:border-gold-bright hover:bg-gold-bright/10 transition-all font-mystic text-lg uppercase tracking-[0.3em]"
            >
              Nouvelle Vision
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendulumRoom;

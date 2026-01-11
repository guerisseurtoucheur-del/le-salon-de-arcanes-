
import React, { useState, useEffect } from 'react';
import { getPendulumResponse } from '../services/geminiService';

const PendulumRoom: React.FC<{ onBack: () => void }> = () => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<{answer: string, reason: string} | null>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  // Le pendule est maintenant "dropped" par défaut pour être visible dès le départ
  const [isDropped, setIsDropped] = useState(true);
  const [rotationClass, setRotationClass] = useState('');

  const askPendulum = async () => {
    if (!question.trim()) return;
    
    // Reset prior state
    setResult(null);
    setRotationClass('');
    
    // Phase 1 : Le balancement s'intensifie pendant la recherche
    setIsSwinging(true);
    
    try {
      // Appel API Gemini
      const pendulumTask = getPendulumResponse(question);
      // On garantit au moins 4s de balancement pour bien voir le pendule bouger avant la réponse
      const timerTask = new Promise(resolve => setTimeout(resolve, 4000));
      
      const [res] = await Promise.all([pendulumTask, timerTask]);
      
      // Phase 2 : Arrêt net sur la réponse
      setIsSwinging(false);
      setResult(res);
      
      const answer = res.answer.toUpperCase();
      if (answer.includes('OUI')) {
        setRotationClass('rotate-[40deg]');
      } else if (answer.includes('NON')) {
        setRotationClass('rotate-[-40deg]');
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
      <div className="text-center max-w-lg space-y-4 animate-fade z-50">
        <h2 className="text-4xl md:text-5xl font-mystic text-gold-bright tracking-[0.3em] uppercase drop-shadow-lg">Le Sanctuaire des Vérités</h2>
        <p className="text-gold-muted font-serif italic text-xl">Le cristal capte les échos de votre destinée.</p>
      </div>

      {/* Realistic Pendulum Area */}
      <div className="relative h-[550px] w-full flex flex-col items-center pendulum-anchor mt-4">
        
        {/* Support Hook */}
        <div className="w-32 h-4 bg-gradient-to-r from-transparent via-gold-muted to-transparent rounded-full relative z-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-gold-bright bg-velvet-deep flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.6)]">
             <div className="w-3 h-3 bg-gold-bright rounded-full animate-pulse shadow-[0_0_10px_gold]"></div>
          </div>
        </div>

        {/* Pendulum Arm */}
        <div 
          className={`pendulum-arm absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 ${
            isSwinging ? 'swing-active' : (result ? rotationClass : 'swing-subtle')
          }`}
          style={{ 
            top: isDropped ? '0px' : '-250px', 
            transition: 'top 2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
          }}
        >
          {/* Chain */}
          <div className="w-[3px] h-[380px] bg-gradient-to-b from-gold-muted via-gold-bright to-gold-muted shadow-[0_0_15px_rgba(255,215,0,0.4)] relative">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_4px,rgba(255,255,255,0.2)_5px,transparent_6px)]"></div>
          </div>
          
          {/* Crystal Weight */}
          <div className="relative -mt-2">
             <div className={`absolute inset-0 w-40 h-48 -left-12 -top-12 blur-[60px] rounded-full transition-all duration-1000 ${
               isSwinging ? 'bg-gold-bright opacity-60 scale-150 animate-pulse' : 
               result?.answer.includes('OUI') ? 'bg-green-500 opacity-60 scale-125' :
               result?.answer.includes('NON') ? 'bg-red-500 opacity-60 scale-125' : 
               'bg-purple-500 opacity-20'
             }`}></div>
             
             <div className={`pendulum-weight w-14 h-20 relative z-10 flex items-center justify-center transition-all duration-500 ${isSwinging ? 'crystal-glow-active' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-full opacity-60 bg-[url('https://www.transparenttextures.com/patterns/glass-shattered.png')]"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-white/30 to-transparent rounded-full blur-md"></div>
                <div className="absolute top-4 left-4 w-4 h-8 bg-white/70 blur-[2px] rounded-full rotate-12"></div>
             </div>
          </div>
        </div>
        
        {/* Dynamic Shadow */}
        <div className="absolute bottom-12 w-full flex justify-center pointer-events-none">
           <div className={`w-24 h-6 bg-black/90 rounded-full blur-3xl transition-all duration-300 ${
             isSwinging ? 'animate-[shadow-move-active_1.2s_infinite_alternate]' : 
             result?.answer.includes('OUI') ? 'translate-x-[100px] opacity-60 scale-x-150' :
             result?.answer.includes('NON') ? 'translate-x-[-100px] opacity-60 scale-x-150' : 
             'animate-[shadow-move-subtle_4s_infinite_alternate] opacity-40 scale-x-100'
           }`}></div>
        </div>

        {/* Labels OUI / NON au sol */}
        <div className={`absolute bottom-4 w-full max-w-4xl flex justify-between px-24 font-mystic text-6xl tracking-[0.5em] pointer-events-none select-none transition-opacity duration-1000`}>
          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('NON') ? 'text-red-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] brightness-150' : 'opacity-20 text-gold-muted'}`}>NON</span>
            <div className={`w-8 h-8 rounded-full transition-all duration-1000 ${result?.answer.includes('NON') ? 'bg-red-500 scale-150 shadow-[0_0_25px_red]' : 'bg-gold-muted/20'}`}></div>
          </div>

          <div className="self-center h-[2px] w-64 bg-gradient-to-r from-transparent via-gold-muted/40 to-transparent"></div>

          <div className="flex flex-col items-center gap-6">
            <span className={`transition-all duration-1000 ${result?.answer.includes('OUI') ? 'text-green-500 opacity-100 scale-125 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)] brightness-150' : 'opacity-20 text-gold-muted'}`}>OUI</span>
            <div className={`w-8 h-8 rounded-full transition-all duration-1000 ${result?.answer.includes('OUI') ? 'bg-green-500 scale-150 shadow-[0_0_25px_green]' : 'bg-gold-muted/20'}`}></div>
          </div>
        </div>
      </div>

      {/* Interaction Area */}
      <div className="w-full max-w-2xl space-y-6 z-40 px-6 mt-[-40px]">
        {!result && !isSwinging && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative group mb-10">
              <input 
                type="text"
                placeholder="Ex: Mon voyage sera-t-il propice ?"
                className="w-full bg-black/90 border-2 border-gold-muted/40 p-8 rounded-[2rem] text-gold-bright text-2xl font-serif italic focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
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
              Quelle question sur votre avenir vous posez-vous ?
            </button>
          </div>
        )}

        {isSwinging && (
          <div className="text-center space-y-10 animate-pulse p-12 bg-black/60 rounded-[3rem] backdrop-blur-xl border border-gold-muted/30 shadow-3xl">
            <p className="font-mystic text-gold-bright text-3xl tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">Les énergies s'équilibrent...</p>
            <div className="flex justify-center gap-8">
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-duration:0.8s]"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.8s]"></div>
               <div className="w-4 h-4 bg-gold-bright rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.8s]"></div>
            </div>
          </div>
        )}

        {result && (
          <div className="text-center space-y-10 animate-in zoom-in-95 duration-700 p-14 glass-mystic gold-border rounded-[4rem] shadow-[0_40px_120px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000 ${result.answer.includes('OUI') ? 'bg-green-600' : 'bg-red-600'}`}></div>
            
            <div className="relative inline-block">
               <h3 className={`text-8xl md:text-9xl font-mystic mb-4 tracking-[0.6em] drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-colors duration-1000 ${
                 result.answer.includes('OUI') ? 'text-green-500' : result.answer.includes('NON') ? 'text-red-500' : 'text-gold-bright'
               }`}>
                 {result.answer}
               </h3>
               <div className={`h-2 w-full bg-gradient-to-r from-transparent via-${result.answer.includes('OUI') ? 'green-500' : 'red-500'}/60 to-transparent`}></div>
            </div>
            
            <p className="italic text-4xl md:text-5xl text-gold-muted font-cursive leading-relaxed px-10 drop-shadow-lg">
              "{result.reason}"
            </p>
            
            <button 
              onClick={reset}
              className="mt-10 px-16 py-5 rounded-full border-2 border-gold-muted/50 text-gold-muted hover:text-gold-bright hover:border-gold-bright hover:bg-gold-bright/20 transition-all font-mystic text-xl uppercase tracking-[0.4em]"
            >
              Autre Consultation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendulumRoom;

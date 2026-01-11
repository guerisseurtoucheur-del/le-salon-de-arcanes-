
import React, { useState, useRef, useEffect } from 'react';
import { askNexusNano } from '../services/geminiService';

const NexusRoom: React.FC<{ onBack: () => void }> = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isThinking]);

  const handleConsult = async () => {
    if (!query.trim() || isThinking) return;
    setIsThinking(true);
    setResponse('');
    try {
      const res = await askNexusNano(query);
      setResponse(res);
    } catch (e) {
      setResponse("Le Nexus est temporairement instable. Retentez plus tard.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 min-h-[80vh]">
      <div className="text-center space-y-4 animate-fade">
        <h2 className="text-5xl font-mystic text-gold-bright tracking-[0.4em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Le Nexus de Nano</h2>
        <p className="text-gold-muted font-serif italic text-xl">L'Intelligence au-delà des voiles temporels.</p>
      </div>

      {/* Cosmic Visualization */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <div className={`absolute inset-0 bg-gold-bright/5 rounded-full blur-[100px] transition-all duration-1000 ${isThinking ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}`}></div>
        
        {/* Hexagonal Core */}
        <div className={`relative z-10 w-48 h-48 bg-gradient-to-br from-purple-900 to-black border-4 border-gold-bright/30 rotate-45 transition-all duration-700 flex items-center justify-center ${isThinking ? 'animate-spin border-gold-bright shadow-[0_0_50px_gold]' : ''}`}>
           <div className={`w-32 h-32 bg-black/60 border-2 border-gold-muted/20 flex items-center justify-center -rotate-45`}>
              <span className={`text-6xl drop-shadow-[0_0_15px_gold] transition-all duration-500 ${isThinking ? 'scale-150 opacity-100' : 'opacity-40'}`}>🔷</span>
           </div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
            {[...Array(8)].map((_, i) => (
                <div 
                    key={i} 
                    className="absolute w-2 h-2 bg-gold-bright rounded-full animate-ping"
                    style={{
                        top: `${50 + 40 * Math.sin(i * Math.PI / 4)}%`,
                        left: `${50 + 40 * Math.cos(i * Math.PI / 4)}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '3s'
                    }}
                />
            ))}
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8 z-20">
        <div className="relative group">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Posez une question sur les paradoxes du monde..."
              className="w-full bg-black/80 border-2 border-gold-muted/30 p-8 rounded-3xl text-gold-bright text-2xl font-serif italic focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20 shadow-2xl min-h-[150px] resize-none"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleConsult()}
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/0 via-gold-bright/10 to-purple-600/0 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>

        <button 
          onClick={handleConsult}
          disabled={!query.trim() || isThinking}
          className="w-full py-6 bg-gradient-to-r from-purple-950 via-purple-900 to-black border-2 border-gold-muted text-gold-bright font-mystic text-2xl tracking-[0.5em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_50px_rgba(59,7,100,0.5)] uppercase rounded-2xl"
        >
          {isThinking ? 'Synchronisation du Nexus...' : 'Interroger Nano'}
        </button>

        {isThinking && (
          <div className="p-10 bg-black/40 rounded-3xl border border-gold-muted/20 animate-pulse text-center">
            <p className="font-mystic text-gold-muted text-xl tracking-widest uppercase mb-4">Nano explore les strates de probabilités...</p>
            <div className="flex justify-center gap-4">
               <div className="w-3 h-3 bg-gold-bright rounded-full animate-bounce [animation-delay:0s]"></div>
               <div className="w-3 h-3 bg-gold-bright rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-3 h-3 bg-gold-bright rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        {response && (
          <div ref={responseRef} className="p-12 glass-mystic gold-border rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center gap-4 mb-8 border-b border-gold-muted/20 pb-4">
                <span className="text-3xl text-gold-bright">🔷</span>
                <span className="font-mystic text-gold-bright text-sm uppercase tracking-[0.4em]">Transmission de Nano</span>
            </div>
            <div className="prose prose-invert max-w-none text-gold-bright/90 font-serif text-2xl leading-relaxed italic">
                {response.split('\n').map((para, i) => (
                    <p key={i} className="mb-6">{para}</p>
                ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gold-muted/10 flex justify-end">
                <button 
                  onClick={() => { setQuery(''); setResponse(''); }}
                  className="text-gold-muted hover:text-gold-bright text-xs font-mystic uppercase tracking-widest transition-colors"
                >
                  Réinitialiser le Nexus
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NexusRoom;

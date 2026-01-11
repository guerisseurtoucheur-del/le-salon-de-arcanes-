
import React, { useState, useRef, useEffect } from 'react';
import { askNexusNano } from '../services/geminiService';

const NexusRoom: React.FC<{ onBack: () => void }> = () => {
  const [step, setStep] = useState<'id' | 'sync' | 'chat'>('id');
  const [userData, setUserData] = useState({ name: '', birthDate: '' });
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [time, setTime] = useState(new Date());
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isThinking]);

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData.name || !userData.birthDate) return;
    
    setStep('sync');
    setIsThinking(true);
    
    try {
      const today = new Date().toLocaleString('fr-FR');
      const initialPrompt = `SYCHRONISATION REQUISE. 
      Identité : ${userData.name}. Incarnation : ${userData.birthDate}. 
      Cycle Précis : ${today}. 
      Analyse la convergence entre sa fréquence de naissance et l'énergie atomique de ce jour précis. 
      Établis son profil cyber-mystique et fais une prédiction précise sur les probabilités de ce cycle spécifique.`;
      
      const res = await askNexusNano(initialPrompt);
      setResponse(res);
      setStep('chat');
    } catch (e) {
      setResponse("Erreur de synchronisation temporelle. Le Nexus rejette les données.");
      setStep('id');
    } finally {
      setIsThinking(false);
    }
  };

  const handleConsult = async () => {
    if (!query.trim() || isThinking) return;
    setIsThinking(true);
    setResponse('');
    try {
      const today = new Date().toLocaleString('fr-FR');
      const enrichedQuery = `[Identité: ${userData.name}, Naissance: ${userData.birthDate}, Temps Réel: ${today}] Question : ${query}`;
      const res = await askNexusNano(enrichedQuery);
      setResponse(res);
    } catch (e) {
      setResponse("Le Nexus subit une interférence temporelle. Retentez plus tard.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 min-h-[80vh]">
      {/* Real-time Status Header */}
      <div className="w-full max-w-2xl flex justify-between items-center px-6 py-2 bg-blue-900/30 border-x border-t border-blue-400/50 rounded-t-3xl text-[11px] font-mono tracking-tighter text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          STATUS: ONLINE - SYNC_SUCCESS
        </span>
        <span className="font-mystic tracking-widest uppercase">
          {time.toLocaleTimeString('fr-FR')} : {time.getMilliseconds()}ms
        </span>
      </div>

      <div className="text-center space-y-4 animate-fade">
        <h2 className="text-5xl font-mystic text-gold-bright tracking-[0.4em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Le Nexus de Nano</h2>
        <p className="text-gold-muted font-serif italic text-xl">Calculateur de Destinée Quantique.</p>
      </div>

      {/* Cosmic Visualization with Date Halo */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-4">
        <div className={`absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isThinking ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}`}></div>
        
        {/* Hexagonal Core */}
        <div className={`relative z-10 w-40 h-40 bg-gradient-to-br from-blue-950 to-black border-4 border-blue-400/30 rotate-45 transition-all duration-700 flex items-center justify-center ${isThinking || step === 'sync' ? 'animate-spin border-blue-400 shadow-[0_0_60px_rgba(59,130,246,0.6)]' : ''}`}>
           <div className={`w-28 h-28 bg-black/60 border-2 border-blue-400/20 flex items-center justify-center -rotate-45`}>
              <span className={`text-6xl drop-shadow-[0_0_20px_rgba(59,130,246,0.9)] transition-all duration-500 ${isThinking ? 'scale-150 opacity-100' : 'opacity-60'}`}>🔷</span>
           </div>
        </div>
        
        {/* Orbiting Time Indicators */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`absolute w-full h-full border border-dashed border-blue-500/20 rounded-full ${isThinking ? 'animate-spin' : ''}`} style={{ animationDuration: '25s' }}></div>
            <div className={`absolute w-64 h-64 border border-gold-bright/10 rounded-full ${isThinking ? 'animate-spin' : ''}`} style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8 z-20">
        {step === 'id' && (
          <form onSubmit={handleIdentitySubmit} className="glass-mystic p-10 rounded-b-[2rem] border-2 border-t-0 border-blue-500/30 space-y-8 animate-in zoom-in-95 duration-500">
            <h3 className="text-2xl font-mystic text-blue-400 text-center tracking-widest uppercase">Initialisation du Scan Temporel</h3>
            <p className="text-gold-muted text-center italic">Le Nexus fusionne votre naissance avec l'instant T.</p>
            
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-mystic text-gold-muted uppercase tracking-[0.3em] mb-2 ml-2">Prénom d'origine</label>
                <input 
                  type="text" 
                  required
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                  placeholder="Nommez votre essence..."
                  className="w-full bg-black/60 border-2 border-blue-500/20 p-4 rounded-xl text-blue-100 font-serif focus:outline-none focus:border-blue-400 transition-all placeholder:text-blue-900/40"
                />
              </div>

              <div className="group">
                <label className="block text-xs font-mystic text-gold-muted uppercase tracking-[0.3em] mb-2 ml-2">Date d'incarnation (Naissance)</label>
                <input 
                  type="date" 
                  required
                  value={userData.birthDate}
                  onChange={(e) => setUserData({...userData, birthDate: e.target.value})}
                  className="w-full bg-black/60 border-2 border-blue-500/20 p-4 rounded-xl text-blue-100 font-serif focus:outline-none focus:border-blue-400 transition-all color-scheme-dark"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-blue-900/40 border-2 border-blue-400 text-blue-400 font-mystic text-xl tracking-[0.4em] hover:bg-blue-400 hover:text-black transition-all shadow-[0_0_40px_rgba(59,130,246,0.4)] uppercase rounded-xl"
            >
              Aligner les Flux
            </button>
          </form>
        )}

        {step === 'sync' && (
          <div className="p-12 glass-mystic border-2 border-blue-500/30 rounded-[3rem] text-center space-y-8 animate-pulse">
            <div className="flex justify-center gap-4">
               <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:0s]"></div>
               <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p className="font-mystic text-blue-400 text-2xl tracking-[0.3em] uppercase">Interrogation de l'Ether Numérique...</p>
            <p className="text-gold-muted italic">Calcul du rapport entre votre naissance et ce cycle précis.</p>
          </div>
        )}

        {step === 'chat' && (
          <div className="space-y-8 animate-in fade-in duration-1000">
            {response && (
              <div ref={responseRef} className="p-12 glass-mystic border-2 border-blue-500/30 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl pointer-events-none text-blue-400">🔷</div>
                <div className="flex items-center gap-4 mb-8 border-b border-blue-500/20 pb-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                    <span className="font-mystic text-blue-400 text-sm uppercase tracking-[0.4em]">Analyse du Cycle Actuel - {userData.name}</span>
                </div>
                <div className="prose prose-invert max-w-none text-blue-100/90 font-serif text-2xl leading-relaxed italic">
                    {response.split('\n').map((para, i) => (
                        <p key={i} className="mb-6">{para}</p>
                    ))}
                </div>
              </div>
            )}

            <div className="relative group">
                <textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Posez une question sur ce cycle temporel..."
                  className="w-full bg-black/80 border-2 border-blue-500/30 p-8 rounded-3xl text-blue-200 text-2xl font-serif italic focus:outline-none focus:border-blue-400 transition-all placeholder:text-blue-900/40 shadow-2xl min-h-[150px] resize-none"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleConsult()}
                />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleConsult}
                disabled={!query.trim() || isThinking}
                className="flex-1 py-6 bg-gradient-to-r from-blue-950 to-black border-2 border-blue-500/40 text-blue-400 font-mystic text-xl tracking-[0.5em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_50px_rgba(30,58,138,0.5)] uppercase rounded-2xl"
              >
                {isThinking ? 'Recalcul du Destin...' : 'Actualiser les Probabilités'}
              </button>
              <button 
                onClick={() => { setStep('id'); setResponse(''); setUserData({name:'', birthDate:''}); }}
                className="px-6 border-2 border-gold-muted/20 text-gold-muted hover:border-gold-muted hover:text-gold-bright transition-all rounded-2xl bg-black/40"
                title="Déconnexion du Nexus"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NexusRoom;

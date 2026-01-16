
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, AUDIO_THEMES } from './types';
import Dashboard from './components/Dashboard';
import TarotRoom from './components/TarotRoom';
import CrystalBallRoom from './components/CrystalBallRoom';
import AstrologyRoom from './components/AstrologyRoom';
import PendulumRoom from './components/PendulumRoom';
import CecileDeepRoom from './components/CecileDeepRoom';
import NexusRoom from './components/NexusRoom';
import { generateSpeech, decodeAudio, decodeAudioData } from './services/geminiService';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
}

const Candle: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative flex flex-col items-center ${className}`}>
    <div className="relative mb-1">
      <div className="flame-glow w-24 md:w-32 h-24 md:h-32 bg-amber-500/10 rounded-full absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 blur-3xl animate-glow-pulse-heavy"></div>
      <div className="flame w-3 md:w-5 h-12 md:h-20 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-50 rounded-full blur-[1px] animate-flame-dance origin-bottom shadow-[0_0_40px_rgba(251,191,36,0.8)] relative">
        <div className="absolute inset-x-1 top-4 bottom-2 bg-white/60 rounded-full blur-[2px]"></div>
      </div>
    </div>
    <div className="w-6 md:w-8 h-24 md:h-40 bg-gradient-to-b from-[#2a1a0a] via-[#4d3319] to-[#1a0f05] rounded-t-sm shadow-inner relative border-x border-gold-muted/20">
      <div className="absolute top-0 left-0 w-full h-2 bg-black/40 blur-[1px]"></div>
    </div>
    <div className="w-12 md:w-16 h-2 md:h-3 bg-gold-muted/40 rounded-full -mt-1 shadow-lg"></div>
  </div>
);

const ClickBurst: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  const particles = ['💎', '✨', '🔮', '💠', '🌟', '💎', '💠'];
  return (
    <div 
      className="fixed pointer-events-none z-[999]" 
      style={{ left: x, top: y }}
    >
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-gem-fly text-xl md:text-2xl"
          style={{
            '--tx': `${(Math.random() - 0.5) * 300}px`,
            '--ty': `${(Math.random() - 0.5) * 300}px`,
            '--rot': `${Math.random() * 720}deg`,
            animationDelay: `${Math.random() * 0.05}s`,
          } as React.CSSProperties}
        >
          {particles[i % particles.length]}
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [time, setTime] = useState(new Date());
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [bursts, setBursts] = useState<ClickParticle[]>([]);
  const [tokens, setTokens] = useState<number>(() => {
    const saved = localStorage.getItem('cecile_tokens');
    if (saved === null) return 3; 
    return parseInt(saved, 10);
  });
  const [showShop, setShowShop] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Nouveaux états pour l'accueil vocal
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('cecile_tokens', tokens.toString());
  }, [tokens]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playWelcomeGreeting = async () => {
    if (hasGreeted || isEntering || hasEntered) return;
    
    setHasGreeted(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsSpeaking(true);
      const message = "Bonjour à vous, belles âmes. Bienvenue dans mon salon, où l'invisible se dévoile enfin à vos yeux.";
      const audioData = await generateSpeech(message);
      
      if (audioData) {
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
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error("Erreur accueil vocal:", e);
      setIsSpeaking(false);
    }
  };

  const handleGlobalClick = (e: React.MouseEvent | React.TouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Déclencher la voix au premier clic sur l'accueil
    if (!hasEntered && !hasGreeted) {
      playWelcomeGreeting();
    }

    const id = Date.now();
    setBursts(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== id));
    }, 1000);
  };

  const formatCelestialDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options).toUpperCase();
  };

  const enterSalon = async () => {
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    chime.volume = 0.6;
    chime.play().catch(() => {});
    
    setIsEntering(true);
    setIsSpeaking(false); // Arrêter l'animation de parole si on entre
    
    setTimeout(() => {
      setHasEntered(true);
      setIsEntering(false);
      if (tokens <= 0) {
        setShowShop(true);
      }
    }, 1400);
  };

  const handleNavigation = (view: ViewType) => {
    if (view === ViewType.DASHBOARD) {
      setCurrentView(ViewType.DASHBOARD);
      return;
    }
    if (tokens > 0) {
      setTokens(prev => Math.max(0, prev - 1));
      setCurrentView(view);
    } else {
      setShowShop(true);
    }
  };

  const buyTokens = (amount: number) => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setTokens(prev => prev + amount);
      setIsProcessingPayment(false);
      setShowShop(false);
      const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      chime.volume = 0.4;
      chime.play().catch(() => {});
    }, 1500);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.TAROT: return <TarotRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CRYSTAL_BALL: return <CrystalBallRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.ASTROLOGY: return <AstrologyRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PENDULUM: return <PendulumRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CECIL_DEEP: return <CecileDeepRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.NEXUS: return <NexusRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      default: return <Dashboard onNavigate={handleNavigation} tokens={tokens} onOpenShop={() => setShowShop(true)} />;
    }
  };

  return (
    <div 
      className="min-h-screen bg-black overflow-x-hidden selection:bg-gold-bright selection:text-black" 
      onMouseDown={handleGlobalClick}
    >
      {bursts.map(burst => (
        <ClickBurst key={burst.id} x={burst.x} y={burst.y} />
      ))}

      {!hasEntered ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]"></div>
          
          {/* Bougies bien écartées aux extrémités */}
          <div className={`absolute inset-0 flex items-center justify-between px-6 md:px-40 pointer-events-none transition-all duration-1000 ${isEntering ? 'opacity-0 scale-90 blur-xl' : 'animate-in fade-in'}`}>
            <Candle />
            <Candle />
          </div>
          
          {/* Bloc central complet */}
          <div className={`text-center flex flex-col items-center relative z-10 w-full transition-all duration-1000 ${isEntering ? 'opacity-0 scale-110 blur-2xl' : 'animate-in fade-in zoom-in'}`}>
            <div className="space-y-2 md:space-y-4 mb-8 md:mb-12 relative">
              {/* Onde vocale de Cécile */}
              {isSpeaking && (
                <div className="absolute -inset-10 md:-inset-20 border-2 border-gold-bright/30 rounded-full animate-vocal-pulse pointer-events-none"></div>
              )}
              <h1 className="text-4xl md:text-8xl font-mystic text-gold-bright tracking-[0.1em] md:tracking-[0.2em] uppercase drop-shadow-2xl">Le Salon de Cécile</h1>
              <p className="text-gold-muted font-cursive text-xl md:text-5xl italic opacity-80">L'invisible vous attend...</p>
              
              {/* Indicateur vocal discret */}
              {isSpeaking && (
                <div className="mt-4 flex justify-center gap-1.5 h-6 items-center">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-1 bg-gold-bright/80 rounded-full animate-bar-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              )}
            </div>

            {/* Grille de symboles resserrée JUSTE au-dessus du bouton */}
            <div className="max-w-xl md:max-w-2xl mx-auto mb-4 md:mb-8">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 items-center justify-items-center">
                <LandingFeature icon="👁️" label="Oracle" delay="0s" animationClass="animate-mystic-eye" />
                <LandingFeature icon="🔮" label="Visions" delay="0.1s" animationClass="animate-mystic-ball" />
                <LandingFeature icon="✨" label="Astres" delay="0.2s" animationClass="animate-mystic-stars" />
                <LandingFeature icon="⚖️" label="Pendule" delay="0.3s" animationClass="animate-mystic-pendulum" />
                <LandingFeature icon="📜" label="Votre Futur" delay="0.4s" animationClass="animate-mystic-scroll" />
                <LandingFeature icon="🔷" label="Nexus Nano" delay="0.5s" animationClass="animate-mystic-nexus" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button 
                onClick={(e) => { e.stopPropagation(); enterSalon(); }}
                disabled={isEntering}
                className={`group relative px-10 md:px-20 py-5 md:py-8 bg-black/40 border-2 border-gold-bright/30 rounded-full transition-all hover:border-gold-bright hover:shadow-[0_0_60px_rgba(255,215,0,0.6)] active:scale-95 ${isEntering ? 'opacity-0 scale-150' : ''}`}
              >
                <span className="relative z-10 font-mystic text-gold-bright text-lg md:text-3xl tracking-widest uppercase block">
                  Entrer
                </span>
                <div className="absolute inset-0 rounded-full bg-gold-bright/10 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
              </button>
              
              {!hasGreeted && !isEntering && (
                <p className="mt-4 font-mystic text-[8px] md:text-[10px] text-gold-muted/40 uppercase tracking-[0.2em] animate-pulse">
                  Un murmure vous attend... Touchez l'écran.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="salon-container relative animate-in fade-in duration-1000 pb-20">
          <div className="fixed top-4 md:top-20 right-4 md:right-8 z-[110]">
            <button onClick={(e) => { e.stopPropagation(); setShowShop(true); }} className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-gold-bright/30 px-4 py-1.5 rounded-full hover:border-gold-bright transition-all">
              <span className="text-gold-bright font-mystic text-sm md:text-lg">{tokens}</span>
              <span className="text-xl">🪙</span>
            </button>
          </div>

          <div className="fixed top-0 left-0 w-full z-50 pointer-events-none px-4">
            <div className="max-w-screen-xl mx-auto flex justify-center">
              <div className="bg-black/60 backdrop-blur-md border-x border-b border-gold-muted/30 px-4 py-1 rounded-b-xl shadow-lg">
                <span className="text-[8px] md:text-[10px] font-mystic text-gold-bright tracking-widest">
                  {formatCelestialDate(time)}
                </span>
              </div>
            </div>
          </div>

          <header className="text-center mb-8 md:mb-12 mt-8">
            <h1 className="text-3xl md:text-5xl font-mystic text-gold-bright tracking-widest uppercase">Le Salon de Cécile</h1>
            <p className="font-cursive text-xl md:text-3xl text-gold-muted">Voyance & Mystères</p>
          </header>

          {currentView !== ViewType.DASHBOARD && (
            <nav className="flex justify-center flex-wrap gap-2 md:gap-4 mb-6 md:mb-8 px-2 overflow-x-auto no-scrollbar">
              <button className={`nav-tab-mobile ${currentView === ViewType.TAROT ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleNavigation(ViewType.TAROT); }}>Oracle</button>
              <button className={`nav-tab-mobile ${currentView === ViewType.CRYSTAL_BALL ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleNavigation(ViewType.CRYSTAL_BALL); }}>Boule</button>
              <button className={`nav-tab-mobile ${currentView === ViewType.ASTROLOGY ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleNavigation(ViewType.ASTROLOGY); }}>Astro</button>
              <button className={`nav-tab-mobile ${currentView === ViewType.PENDULUM ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleNavigation(ViewType.PENDULUM); }}>Pendule</button>
              <button className={`nav-tab-mobile ${currentView === ViewType.CECIL_DEEP ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleNavigation(ViewType.CECIL_DEEP); }}>Visions</button>
            </nav>
          )}

          <main className={`${currentView === ViewType.CRYSTAL_BALL ? '' : 'glass-mystic gold-border'} p-4 md:p-8 rounded-xl min-h-[50vh] relative`}>
            {renderView()}
          </main>

          {showShop && (
            <ShopOverlay onClose={() => setShowShop(false)} onBuy={buyTokens} isProcessing={isProcessingPayment} />
          )}

          <footer className="mt-8 text-center text-gold-muted/30 text-[8px] uppercase tracking-widest">
            L'invisible ne ment jamais
          </footer>
        </div>
      )}

      <style>{`
        .nav-tab-mobile {
          padding: 0.5rem 1rem;
          background: rgba(45, 14, 78, 0.4);
          color: #b8860b;
          border: 1px solid rgba(184, 134, 11, 0.3);
          font-family: 'Uncial Antiqua';
          text-transform: uppercase;
          font-size: 10px;
          border-radius: 9999px;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .nav-tab-mobile.active {
          background: #ffd700;
          color: black;
          border-color: #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes gem-fly {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.5) rotate(var(--rot)); opacity: 0; }
        }
        .animate-gem-fly {
          animation: gem-fly 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }

        /* Symbol Animations */
        @keyframes mystic-eye {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px gold); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 20px gold); }
        }
        @keyframes mystic-ball {
          0%, 100% { transform: translateY(0) rotate(0deg); filter: hue-rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); filter: hue-rotate(45deg); }
        }
        @keyframes mystic-stars {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.4; transform: scale(1.2) rotate(15deg); }
        }
        @keyframes mystic-pendulum {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes mystic-scroll {
          0%, 100% { transform: skewX(0deg) scale(1); }
          50% { transform: skewX(4deg) scale(1.05); }
        }
        @keyframes mystic-nexus {
          0%, 100% { transform: rotate(45deg) scale(1); filter: brightness(1); }
          50% { transform: rotate(225deg) scale(1.15); filter: brightness(1.4) drop-shadow(0 0 12px #3b82f6); }
        }

        @keyframes vocal-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes bar-pulse {
          0%, 100% { height: 10%; }
          50% { height: 100%; }
        }

        .animate-mystic-eye { animation: mystic-eye 3s infinite ease-in-out; }
        .animate-mystic-ball { animation: mystic-ball 5s infinite ease-in-out; }
        .animate-mystic-stars { animation: mystic-stars 2s infinite ease-in-out; }
        .animate-mystic-pendulum { animation: mystic-pendulum 2.5s infinite ease-in-out; transform-origin: top center; }
        .animate-mystic-scroll { animation: mystic-scroll 4s infinite ease-in-out; }
        .animate-mystic-nexus { animation: mystic-nexus 8s infinite linear; }
        .animate-vocal-pulse { animation: vocal-pulse 2s infinite cubic-bezier(0, 0.4, 0.4, 1); }
        .animate-bar-pulse { animation: bar-pulse 0.8s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

const LandingFeature: React.FC<{ icon: string, label: string, delay: string, animationClass: string }> = ({ icon, label, delay, animationClass }) => (
  <div className="flex flex-col items-center gap-2 animate-in fade-in group" style={{ animationDelay: delay }}>
    <span className={`text-3xl md:text-5xl lg:text-5xl cursor-default transition-all duration-300 group-hover:scale-125 ${animationClass}`}>{icon}</span>
    <span className="font-mystic text-gold-muted text-[6px] md:text-[8px] uppercase tracking-[0.2em] text-center whitespace-nowrap opacity-70 group-hover:opacity-100 group-hover:text-gold-bright transition-all">{label}</span>
  </div>
);

const ShopOverlay: React.FC<{ onClose: () => void, onBuy: (amount: number) => void, isProcessing: boolean }> = ({ onClose, onBuy, isProcessing }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={(e) => e.stopPropagation()}>
    <div className="relative w-full max-w-md glass-mystic gold-border p-8 rounded-[2rem] text-center space-y-8">
      {!isProcessing && <button onClick={onClose} className="absolute top-6 right-6 text-gold-muted">✕</button>}
      {isProcessing ? (
        <div className="py-10 animate-pulse space-y-4">
          <div className="w-12 h-12 border-2 border-t-gold-bright rounded-full animate-spin mx-auto"></div>
          <p className="text-gold-muted font-mystic text-xs">Offrande en cours...</p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-mystic text-gold-bright uppercase">Boutique</h2>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => onBuy(3)} className="p-4 bg-gold-muted/10 border border-gold-muted/30 rounded-xl flex justify-between items-center group hover:bg-gold-bright/10">
              <span className="text-gold-bright font-mystic">3 Éclats</span>
              <span className="text-white">4.90€</span>
            </button>
            <button onClick={() => onBuy(10)} className="p-4 bg-gold-muted/20 border-2 border-gold-bright rounded-xl flex justify-between items-center group shadow-lg">
              <span className="text-gold-bright font-mystic font-bold">10 Éclats</span>
              <span className="text-white">12.90€</span>
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

export default App;

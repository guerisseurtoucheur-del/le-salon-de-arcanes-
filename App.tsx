
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, AUDIO_THEMES } from './types';
import Dashboard from './components/Dashboard';
import TarotRoom from './components/TarotRoom';
import CrystalBallRoom from './components/CrystalBallRoom';
import AstrologyRoom from './components/AstrologyRoom';
import PendulumRoom from './components/PendulumRoom';
import CecileDeepRoom from './components/CecileDeepRoom';
import NexusRoom from './components/NexusRoom';

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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [time, setTime] = useState(new Date());
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [tokens, setTokens] = useState<number>(() => {
    const saved = localStorage.getItem('cecile_tokens');
    return saved ? parseInt(saved, 10) : 1; 
  });
  const [showShop, setShowShop] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    localStorage.setItem('cecile_tokens', tokens.toString());
  }, [tokens]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCelestialDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options).toUpperCase();
  };

  const enterSalon = async () => {
    if (tokens <= 0) {
      setShowShop(true);
      return;
    }
    setShowBurst(true);
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    chime.volume = 0.4;
    chime.play().catch(() => {});
    setIsEntering(true);
    setTimeout(() => {
      setHasEntered(true);
      setIsEntering(false);
      setShowBurst(false);
    }, 1000);
  };

  const handleNavigation = (view: ViewType) => {
    if (view === ViewType.DASHBOARD) {
      setCurrentView(ViewType.DASHBOARD);
      return;
    }
    if (tokens > 0) {
      setTokens(prev => prev - 1);
      setCurrentView(view);
    } else {
      setShowShop(true);
    }
  };

  // Fixed error: added missing buyTokens function to handle token purchase.
  const buyTokens = (amount: number) => {
    setIsProcessingPayment(true);
    // Simulation d'une offrande (paiement)
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

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]"></div>
        <div className={`absolute inset-0 flex items-center justify-between px-6 md:px-40 pointer-events-none transition-all duration-1000 ${isEntering ? 'opacity-0 scale-90' : 'animate-in fade-in'}`}>
          <Candle />
          <Candle />
        </div>
        
        <div className={`text-center space-y-8 md:space-y-12 relative z-10 w-full max-w-5xl ${isEntering ? 'opacity-0 scale-110' : 'animate-in fade-in zoom-in'}`}>
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-4xl md:text-8xl font-mystic text-gold-bright tracking-[0.1em] md:tracking-[0.2em] uppercase drop-shadow-2xl">Le Salon de Cécile</h1>
            <p className="text-gold-muted font-cursive text-xl md:text-5xl italic opacity-80">L'invisible vous attend...</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-6">
            <LandingFeature icon="👁️" label="Oracle" delay="0s" />
            <LandingFeature icon="🔮" label="Visions" delay="0.1s" />
            <LandingFeature icon="✨" label="Astres" delay="0.2s" />
          </div>

          <button 
            onClick={enterSalon}
            disabled={isEntering}
            className="group relative px-10 md:px-20 py-5 md:py-8 bg-black/40 border-2 border-gold-bright/30 rounded-full transition-all hover:border-gold-bright hover:shadow-[0_0_50px_rgba(255,215,0,0.3)] disabled:opacity-0"
          >
            <span className="relative z-10 font-mystic text-gold-bright text-lg md:text-3xl tracking-widest uppercase block">
              Entrer
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="salon-container relative animate-in fade-in duration-1000 pb-20">
      <div className="fixed top-4 md:top-20 right-4 md:right-8 z-[110]">
        <button onClick={() => setShowShop(true)} className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-gold-bright/30 px-4 py-1.5 rounded-full hover:border-gold-bright transition-all">
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
          <button className={`nav-tab-mobile ${currentView === ViewType.TAROT ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.TAROT)}>Oracle</button>
          <button className={`nav-tab-mobile ${currentView === ViewType.CRYSTAL_BALL ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.CRYSTAL_BALL)}>Boule</button>
          <button className={`nav-tab-mobile ${currentView === ViewType.ASTROLOGY ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.ASTROLOGY)}>Astro</button>
          <button className={`nav-tab-mobile ${currentView === ViewType.CECIL_DEEP ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.CECIL_DEEP)}>Visions</button>
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
      `}</style>
    </div>
  );
};

const LandingFeature: React.FC<{ icon: string, label: string, delay: string }> = ({ icon, label, delay }) => (
  <div className="flex flex-col items-center gap-1 animate-in fade-in" style={{ animationDelay: delay }}>
    <span className="text-3xl md:text-5xl">{icon}</span>
    <span className="font-cursive text-gold-muted text-sm md:text-xl">{label}</span>
  </div>
);

const ShopOverlay: React.FC<{ onClose: () => void, onBuy: (amount: number) => void, isProcessing: boolean }> = ({ onClose, onBuy, isProcessing }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
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

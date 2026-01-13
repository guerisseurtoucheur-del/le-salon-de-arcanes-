
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
      {/* Halo de lumière plus intense et plus large */}
      <div className="flame-glow w-32 h-32 bg-amber-500/10 rounded-full absolute -top-16 left-1/2 -translate-x-1/2 blur-3xl animate-glow-pulse-heavy"></div>
      
      {/* Flamme principale plus haute et dansante */}
      <div className="flame w-5 h-20 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-50 rounded-full blur-[1px] animate-flame-dance origin-bottom shadow-[0_0_40px_rgba(251,191,36,0.8)] relative">
        {/* Coeur de la flamme (Partie plus chaude/claire) */}
        <div className="absolute inset-x-1.5 top-6 bottom-2 bg-white/60 rounded-full blur-[2px]"></div>
        {/* Pointe de la flamme (Effet de fumée/chaleur) */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-8 bg-amber-200/20 blur-md rounded-full"></div>
      </div>
    </div>
    
    {/* Corps de la bougie */}
    <div className="w-8 h-40 bg-gradient-to-b from-[#2a1a0a] via-[#4d3319] to-[#1a0f05] rounded-t-sm shadow-inner relative border-x border-gold-muted/20">
      <div className="absolute top-0 left-0 w-full h-2 bg-black/40 blur-[1px]"></div>
      <div className="absolute top-1 left-1.5 w-1 h-10 bg-[#4d3319] rounded-full opacity-60"></div>
      <div className="absolute top-4 right-2 w-1 h-6 bg-[#4d3319] rounded-full opacity-40"></div>
      {/* Effet de cire qui coule */}
      <div className="absolute top-0 right-1 w-2 h-12 bg-[#3d2914] rounded-b-full opacity-80 blur-[0.5px]"></div>
    </div>
    
    {/* Base de la bougie */}
    <div className="w-16 h-3 bg-gold-muted/40 rounded-full -mt-1 shadow-lg border-b border-gold-bright/10"></div>
    <div className="w-20 h-1 bg-black/60 rounded-full mt-0.5"></div>
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
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options).toUpperCase();
  };

  const enterSalon = async () => {
    if (tokens <= 0) {
      setShowShop(true);
      return;
    }

    setShowBurst(true);

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
    }

    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    chime.volume = 0.6;
    chime.play().catch(() => {});

    setIsEntering(true);
    setTimeout(() => {
      setHasEntered(true);
      setIsEntering(false);
      setShowBurst(false);
    }, 1200);
  };

  const handleNavigation = (view: ViewType) => {
    if (view === ViewType.DASHBOARD) {
      setCurrentView(ViewType.DASHBOARD);
      return;
    }

    if (tokens > 0) {
      setTokens(prev => prev - 1);
      setCurrentView(view);
      const doorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');
      doorSound.volume = 0.3;
      doorSound.play().catch(() => {});
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
      
      const coinSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      coinSound.volume = 0.5;
      coinSound.play().catch(() => {});

      if (!hasEntered) {
        enterSalon();
      }
    }, 2500);
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
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]"></div>
        <div className={`absolute inset-0 flex items-center justify-between px-10 md:px-20 lg:px-40 pointer-events-none transition-all duration-1000 ${isEntering ? 'opacity-0 scale-90' : 'animate-in fade-in duration-1000'}`}>
          <Candle className="mb-20" />
          <Candle className="mb-20" />
        </div>
        
        <div className={`text-center space-y-12 transition-all duration-1000 relative z-10 w-full max-w-5xl px-6 ${isEntering ? 'opacity-0 scale-110' : 'animate-in fade-in zoom-in duration-1000'}`}>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-mystic text-gold-bright tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Le Salon de Cécile</h1>
            <p className="text-gold-muted font-cursive text-3xl md:text-5xl italic">L'invisible vous attend...</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 py-10">
            <LandingFeature icon="🃏" label="Tarot Sacré" delay="0s" />
            <LandingFeature icon="🔮" label="Visions de Cristal" delay="0.1s" />
            <LandingFeature icon="✨" label="Oracle des Astres" delay="0.2s" />
            <LandingFeature icon="💎" label="Le Pendule" delay="0.3s" />
            <LandingFeature icon="👁️" label="Sagesse Profonde" delay="0.4s" />
          </div>

          <div className="space-y-8 relative">
            {showBurst && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="crystal-shard"
                    style={{ 
                      '--angle': `${Math.random() * 360}deg`,
                      '--dist': `${100 + Math.random() * 200}px`,
                      '--delay': `${Math.random() * 0.2}s`,
                      '--size': `${10 + Math.random() * 20}px`
                    } as any}
                  >
                    {['✨', '💎', '🔸', '💠'][Math.floor(Math.random() * 4)]}
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={enterSalon}
              disabled={isEntering}
              className="group relative px-12 md:px-20 py-6 md:py-8 bg-transparent border-2 border-gold-bright/30 overflow-hidden rounded-full transition-all hover:border-gold-bright hover:shadow-[0_0_50px_rgba(255,215,0,0.4)] disabled:opacity-0"
            >
              <div className="absolute inset-0 bg-gold-bright/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
              <span className="relative z-10 font-mystic text-gold-bright text-xl md:text-3xl tracking-[0.2em] uppercase group-hover:scale-110 block transition-transform">
                {tokens > 0 ? 'Entrer dans le Salon' : 'Réserver une séance'}
              </span>
            </button>
            
            {tokens === 0 && (
               <p className="text-gold-muted/60 font-mystic text-xs uppercase tracking-[0.4em] animate-pulse">Aucun éclat de destiné • Offrez une offrande pour entrer</p>
            )}
            {tokens > 0 && (
               <p className="text-gold-muted/40 font-mystic text-[10px] uppercase tracking-[0.3em] italic">Une première consultation vous est offerte par les Arcanes</p>
            )}
          </div>
        </div>

        {showShop && (
           <ShopOverlay 
              onClose={() => setShowShop(false)} 
              onBuy={buyTokens} 
              isProcessing={isProcessingPayment} 
           />
        )}
      </div>
    );
  }

  return (
    <div className="salon-container relative animate-in fade-in duration-1000">
      <div className="fixed top-20 right-8 z-[60] flex items-center gap-4 animate-in slide-in-from-top-10 duration-1000 delay-500">
        <button 
          onClick={() => setShowShop(true)}
          className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border-2 border-gold-bright/30 px-5 py-2 rounded-full hover:border-gold-bright transition-all shadow-[0_0_30px_rgba(255,215,0,0.15)] group relative"
        >
          <div className="absolute -inset-1 bg-gold-bright/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-gold-bright font-mystic text-xl drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] relative">{tokens}</span>
          <div className="text-2xl animate-pulse group-hover:scale-125 transition-transform relative">🪙</div>
          <span className="text-[9px] font-mystic text-gold-bright/60 uppercase tracking-[0.2em] ml-2 hidden md:block relative">Éclats de Destin</span>
        </button>
      </div>

      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="max-w-screen-xl mx-auto px-6 py-2 flex justify-center">
          <div className="bg-black/40 backdrop-blur-md border-x border-b border-gold-muted/30 px-6 py-1 rounded-b-2xl shadow-[0_0_20px_rgba(184,134,11,0.2)]">
            <span className="text-[10px] font-mystic text-gold-bright tracking-[0.3em] animate-pulse">
              Cycle Temporel Actuel : {formatCelestialDate(time)}
            </span>
          </div>
        </div>
      </div>

      <header className="text-center mb-12 mt-10">
        <h1 className="text-5xl font-mystic text-gold-bright tracking-widest drop-shadow-lg uppercase">Le Salon de Cécile</h1>
        <p className="font-cursive text-3xl text-gold-muted mt-2">Voyance & Mystères de l'Âme</p>
      </header>

      {currentView !== ViewType.DASHBOARD && (
        <nav className="flex justify-center flex-wrap gap-4 mb-8">
          <button className={`nav-tab ${currentView === ViewType.TAROT ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.TAROT)}>Tarot</button>
          <button className={`nav-tab ${currentView === ViewType.CRYSTAL_BALL ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.CRYSTAL_BALL)}>Boule</button>
          <button className={`nav-tab ${currentView === ViewType.ASTROLOGY ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.ASTROLOGY)}>Astro</button>
          <button className={`nav-tab ${currentView === ViewType.PENDULUM ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.PENDULUM)}>Pendule</button>
          <button className={`nav-tab ${currentView === ViewType.CECIL_DEEP ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.CECIL_DEEP)}>Visions</button>
          <button className={`nav-tab ${currentView === ViewType.NEXUS ? 'active' : ''}`} onClick={() => handleNavigation(ViewType.NEXUS)}>Nexus</button>
        </nav>
      )}

      <main className={`${currentView === ViewType.CRYSTAL_BALL ? '' : 'glass-mystic gold-border'} p-8 rounded-xl animate-fade min-h-[60vh] relative`}>
        {renderView()}
      </main>

      {showShop && (
        <ShopOverlay 
          onClose={() => setShowShop(false)} 
          onBuy={buyTokens} 
          isProcessing={isProcessingPayment} 
        />
      )}

      <footer className="mt-12 text-center text-gold-muted/50 text-sm uppercase tracking-widest">
        L'invisible ne ment jamais • Salon ouvert depuis 2022
      </footer>
    </div>
  );
};

const LandingFeature: React.FC<{ icon: string, label: string, delay: string }> = ({ icon, label, delay }) => (
  <div 
    className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000" 
    style={{ animationDelay: delay }}
  >
    <div className="relative group">
      <div className="absolute inset-0 bg-gold-bright/20 rounded-full blur-xl scale-0 group-hover:scale-150 transition-transform duration-700 opacity-0 group-hover:opacity-100"></div>
      <span className="text-4xl md:text-6xl drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] animate-float-subtle relative block transition-transform group-hover:scale-110">
        {icon}
      </span>
    </div>
    <span className="font-cursive text-gold-muted text-lg md:text-2xl whitespace-nowrap">{label}</span>
  </div>
);

const ShopOverlay: React.FC<{ onClose: () => void, onBuy: (amount: number) => void, isProcessing: boolean }> = ({ onClose, onBuy, isProcessing }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.2)_0%,transparent_70%)]"></div>
    
    <div className="relative w-full max-w-4xl glass-mystic gold-border p-12 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] text-center space-y-12 animate-in zoom-in-95 duration-500">
      {!isProcessing && (
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-gold-muted hover:text-gold-bright transition-all text-2xl"
        >✕</button>
      )}

      {isProcessing ? (
        <div className="py-20 flex flex-col items-center gap-10 animate-pulse">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-gold-muted/20 border-t-gold-bright rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-4xl">🔮</div>
           </div>
           <div className="space-y-4">
             <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Consultation des Astres Bancaires...</h2>
             <p className="text-gold-muted font-serif italic text-xl">L'offrande traverse le voile de l'Ether.</p>
           </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="text-5xl font-mystic text-gold-bright uppercase tracking-widest">Boutique des Arcanes</h2>
            <p className="text-gold-muted font-cursive text-3xl">Acquérez des Éclats pour poursuivre votre voyage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ShopCard title="Pack Initiation" amount={3} price="4.90€" icon="✨" onBuy={() => onBuy(3)} />
            <ShopCard title="Pack Destinée" amount={10} price="12.90€" icon="🔮" onBuy={() => onBuy(10)} isPopular />
            <ShopCard title="Pack Éternité" amount={30} price="29.90€" icon="👁️" onBuy={() => onBuy(30)} />
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-mystic text-gold-muted/40 uppercase tracking-[0.3em]">
              Transactions cryptées par le Grand Oracle du Paiement
            </p>
            <div className="flex gap-4 opacity-30 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

const ShopCard: React.FC<{ title: string, amount: number, price: string, icon: string, onBuy: () => void, isPopular?: boolean }> = ({ title, amount, price, icon, onBuy, isPopular }) => (
  <div className={`relative flex flex-col items-center p-8 bg-black/40 border-2 rounded-3xl transition-all hover:scale-105 group ${isPopular ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.2)]' : 'border-gold-muted/20 hover:border-gold-muted'}`}>
    {isPopular && (
      <span className="absolute -top-4 bg-gold-bright text-black font-mystic text-[10px] px-4 py-1 rounded-full uppercase tracking-widest">Recommandé</span>
    )}
    <span className="text-6xl mb-6 group-hover:animate-bounce transition-transform">{icon}</span>
    <h3 className="text-xl font-mystic text-gold-bright mb-1 uppercase tracking-widest">{title}</h3>
    <div className="flex items-center gap-2 mb-6">
      <span className="text-4xl font-bold text-white">{amount}</span>
      <span className="text-gold-muted font-mystic text-sm">Éclats</span>
    </div>
    <div className="text-2xl font-serif text-gold-muted mb-8 italic">{price}</div>
    <button 
      onClick={onBuy}
      className="w-full py-4 bg-gold-muted/20 border border-gold-muted text-gold-bright font-mystic text-xs uppercase tracking-widest rounded-xl hover:bg-gold-bright hover:text-black transition-all"
    >Obtenir</button>
  </div>
);

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { ViewType, AUDIO_THEMES } from './types';
import Dashboard from './components/Dashboard';
import TarotRoom from './components/TarotRoom';
import CrystalBallRoom from './components/CrystalBallRoom';
import AstrologyRoom from './components/AstrologyRoom';
import PendulumRoom from './components/PendulumRoom';
import CecileDeepRoom from './components/CecileDeepRoom';
import NexusRoom from './components/NexusRoom';
import GrimoireRoom from './components/GrimoireRoom';
import { generateSpeech, decodeAudio, decodeAudioData } from './services/geminiService';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  isBurst?: boolean;
}

const PendulumIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="5" r="3" fill="currentColor" />
    <path d="M50 5 L50 60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M50 60 L65 80 L50 100 L35 80 Z" fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="1" />
    <path d="M50 60 L50 100" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
  </svg>
);

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

const ClickBurst: React.FC<{ x: number, y: number, isBurst?: boolean }> = ({ x, y, isBurst }) => {
  const particles = isBurst ? ['💎', '💠', '✨', '💎', '🌟', '💎', '💠', '✨'] : ['✨', '💎', '🌟'];
  const count = isBurst ? 32 : 8;
  return (
    <div className="fixed pointer-events-none z-[999]" style={{ left: x, top: y }}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-gem-fly text-2xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
          style={{
            '--tx': `${(Math.random() - 0.5) * (isBurst ? 800 : 200)}px`,
            '--ty': `${(Math.random() - 0.5) * (isBurst ? 800 : 200)}px`,
            '--rot': `${Math.random() * 720}deg`,
            animationDuration: isBurst ? '1.8s' : '1s',
            animationDelay: `${Math.random() * 0.15}s`,
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
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [bursts, setBursts] = useState<ClickParticle[]>([]);
  const [tokens, setTokens] = useState<number>(() => {
    const saved = localStorage.getItem('cecile_tokens');
    return saved === null ? 3 : parseInt(saved, 10);
  });
  const [showShop, setShowShop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('cecile_tokens', tokens.toString());
  }, [tokens]);

  const triggerHaptic = (force = 15) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(force);
    }
  };

  const playWelcomeGreeting = async () => {
    if (hasGreeted || hasEntered) return;
    setHasGreeted(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      setIsSpeaking(true);
      const audioData = await generateSpeech("Le salon de Cécile s'ouvre à vous. Prenez place et ouvrez une porte.");
      if (audioData) {
        const buffer = await decodeAudioData(decodeAudio(audioData), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else { setIsSpeaking(false); }
    } catch (e) { setIsSpeaking(false); }
  };

  const handleGlobalClick = (e: React.MouseEvent | React.TouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    if (!hasEntered && !hasGreeted) playWelcomeGreeting();
    triggerHaptic();
    const id = Date.now();
    setBursts(prev => [...prev, { id, x, y }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 2000);
  };

  const enterSalon = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Déclencher le message vocal immédiatement au clic sur Entrer
    playWelcomeGreeting();

    // Son cristallin riche (wind chime)
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    chime.volume = 0.6;
    chime.play().catch(() => {});
    
    const id = Date.now();
    setBursts(prev => [...prev, { id, x: e.clientX, y: e.clientY, isBurst: true }]);
    triggerHaptic(60);
    
    setIsEntering(true);
    // On ne coupe plus la parole de Cécile ici pour qu'elle termine son accueil
    setTimeout(() => {
      setHasEntered(true);
      setIsEntering(false);
    }, 1400);
  };

  const handleNavigation = (view: ViewType) => {
    setIsMenuOpen(false);
    if (view === ViewType.DASHBOARD || view === ViewType.GRIMOIRE) {
      setCurrentView(view);
      return;
    }
    if (tokens > 0) {
      setTokens(prev => Math.max(0, prev - 1));
      setCurrentView(view);
    } else {
      setShowShop(true);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.TAROT: return <TarotRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CRYSTAL_BALL: return <CrystalBallRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.ASTROLOGY: return <AstrologyRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PENDULUM: return <PendulumRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CECIL_DEEP: return <CecileDeepRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.NEXUS: return <NexusRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.GRIMOIRE: return <GrimoireRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      default: return <Dashboard onNavigate={handleNavigation} tokens={tokens} onOpenShop={() => setShowShop(true)} setTokens={setTokens} />;
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-gold-bright selection:text-black font-serif-elegant" onMouseDown={handleGlobalClick}>
      {bursts.map(burst => (
        <ClickBurst key={burst.id} x={burst.x} y={burst.y} isBurst={burst.isBurst} />
      ))}

      {!hasEntered ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]"></div>
          
          {/* Symboles du Salon avec Pendule Dessiné */}
          <div className={`absolute top-10 left-0 w-full flex justify-center items-center gap-6 md:gap-12 transition-all duration-1000 ${isEntering ? 'opacity-0 -translate-y-20 blur-xl' : 'animate-in fade-in slide-in-from-top-10'}`}>
            <span className="text-2xl md:text-4xl filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-60">🃏</span>
            <span className="text-2xl md:text-4xl filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-60" style={{ animationDelay: '0.2s' }}>🔮</span>
            <span className="text-2xl md:text-4xl filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-60" style={{ animationDelay: '0.4s' }}>✨</span>
            {/* Dessin du Pendule */}
            <PendulumIcon className="w-8 h-8 md:w-12 md:h-12 text-gold-bright filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-70" style={{ animationDelay: '0.6s' }} />
            <span className="text-2xl md:text-4xl filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-60" style={{ animationDelay: '0.8s' }}>👁️</span>
            <span className="text-2xl md:text-4xl filter drop-shadow-[0_0_10px_gold] animate-float-subtle opacity-60" style={{ animationDelay: '1.0s' }}>📖</span>
          </div>

          <div className={`absolute inset-0 flex items-center justify-between px-6 md:px-40 pointer-events-none transition-all duration-1000 ${isEntering ? 'opacity-0 scale-90 blur-xl' : ''}`}>
            <Candle />
            <Candle />
          </div>
          
          <div className={`text-center flex flex-col items-center z-10 w-full transition-all duration-1000 ${isEntering ? 'opacity-0 scale-110 blur-2xl' : 'animate-in fade-in zoom-in'}`}>
            <div className="relative mb-4">
              <h1 className="text-5xl md:text-9xl font-mystic text-gold-bright tracking-widest uppercase drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">Le Salon de Cécile</h1>
              {isSpeaking && <div className="absolute -inset-10 border-2 border-gold-bright/30 rounded-full animate-ping pointer-events-none"></div>}
            </div>
            <p className="text-gold-muted font-cursive text-2xl md:text-6xl mb-16 italic opacity-80">L'invisible vous attend...</p>
            
            <button 
              onClick={enterSalon} 
              disabled={isEntering} 
              className="group relative px-14 py-7 md:px-24 md:py-10 bg-black/40 border-2 border-gold-bright/30 rounded-full hover:border-gold-bright hover:shadow-[0_0_80px_rgba(255,215,0,0.7)] active:scale-95 transition-all"
            >
              <div className="absolute inset-0 rounded-full bg-gold-bright/10 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl"></div>
              <span className="relative z-10 font-mystic text-gold-bright text-2xl md:text-4xl tracking-[0.3em] uppercase">Entrer</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="salon-container relative animate-in fade-in duration-1000 pb-20 pt-20">
          <div className="fixed top-0 left-0 w-full z-[120] bg-black/80 backdrop-blur-xl border-b border-gold-muted/20 px-4 py-3 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-4">
              {currentView !== ViewType.DASHBOARD ? (
                <button onClick={() => setCurrentView(ViewType.DASHBOARD)} className="text-gold-bright font-mystic text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                  <span className="text-xl">↩</span> Quitter
                </button>
              ) : (
                <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 flex flex-col justify-center items-center gap-1.5 group">
                  <div className="w-6 h-0.5 bg-gold-bright group-hover:w-8 transition-all"></div>
                  <div className="w-8 h-0.5 bg-gold-bright"></div>
                  <div className="w-6 h-0.5 bg-gold-bright group-hover:w-8 transition-all"></div>
                </button>
              )}
            </div>
            
            <h2 className="font-mystic text-gold-bright text-sm md:text-xl tracking-[0.2em] uppercase hidden md:block">Le Salon de Cécile</h2>
            
            <button onClick={() => setShowShop(true)} className="flex items-center gap-2 bg-gold-bright/10 border border-gold-bright/30 px-4 py-1.5 rounded-full hover:bg-gold-bright/20 transition-all">
              <span className="text-gold-bright font-mystic text-sm">{tokens}</span>
              <span className="text-xl">🪙</span>
            </button>
          </div>

          <div className={`fixed inset-0 z-[200] transition-all duration-700 ${isMenuOpen ? 'visible' : 'invisible'}`}>
            <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)}></div>
            <div className={`absolute left-0 top-0 bottom-0 w-72 md:w-80 parchment shadow-[20px_0_60px_rgba(0,0,0,0.8)] antique-border transition-transform duration-700 flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-8 border-b border-amber-900/10 flex flex-col items-center gap-4">
                <span className="text-6xl filter drop-shadow-md">📖</span>
                <h3 className="font-mystic text-amber-950 text-xl tracking-widest uppercase">Le Grimoire</h3>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <MenuLink icon="🏠" label="Tableau de Bord" active={currentView === ViewType.DASHBOARD} onClick={() => handleNavigation(ViewType.DASHBOARD)} />
                <MenuLink icon="📜" label="Mes Prophéties" active={currentView === ViewType.GRIMOIRE} onClick={() => handleNavigation(ViewType.GRIMOIRE)} />
                <div className="h-px bg-amber-900/10 my-4"></div>
                <MenuLink icon="🃏" label="Oracle des Arcanes" onClick={() => handleNavigation(ViewType.TAROT)} />
                <MenuLink icon="🔮" label="Miroir des Visions" onClick={() => handleNavigation(ViewType.CRYSTAL_BALL)} />
                <MenuLink icon="✨" label="Cercle des Astres" onClick={() => handleNavigation(ViewType.ASTROLOGY)} />
                <MenuLink icon={<PendulumIcon className="w-6 h-6 text-amber-900" />} label="Sanctuaire du Pendule" onClick={() => handleNavigation(ViewType.PENDULUM)} />
              </nav>
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4">
            {renderView()}
          </main>

          {showShop && <ShopOverlay onClose={() => setShowShop(false)} onBuy={(a) => { setTokens(t => t + a); setShowShop(false); }} />}
        </div>
      )}

      <style>{`
        .parchment { background-color: #fdf6e3; background-image: url('https://www.transparenttextures.com/patterns/parchment.png'); }
        .antique-border { border: 2px solid #b8860b; border-image: linear-gradient(to bottom, #b8860b, #ffd700, #b8860b) 1; }
        @keyframes gem-fly {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.8) rotate(var(--rot)); opacity: 0; }
        }
        .animate-gem-fly { animation: gem-fly 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        @keyframes float-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-subtle { animation: float-subtle 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const MenuLink: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${active ? 'bg-amber-900/10 border border-amber-900/20' : 'hover:bg-amber-900/5'}`}>
    <span className="text-2xl">{icon}</span>
    <span className={`font-serif-elegant font-bold text-lg ${active ? 'text-amber-950' : 'text-amber-900/60'}`}>{label}</span>
  </button>
);

const ShopOverlay: React.FC<{ onClose: () => void, onBuy: (amount: number) => void }> = ({ onClose, onBuy }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={onClose}>
    <div className="relative w-full max-w-md glass-mystic p-8 rounded-3xl border-2 border-gold-bright/30 text-center space-y-8" onClick={e => e.stopPropagation()}>
      <h2 className="text-3xl font-mystic text-gold-bright uppercase tracking-widest">Offrandes</h2>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => onBuy(5)} className="p-6 bg-gold-bright/5 border border-gold-bright/20 rounded-2xl flex justify-between items-center group hover:bg-gold-bright/10 transition-all">
          <span className="text-gold-bright font-mystic text-xl">5 Éclats</span>
          <span className="text-white font-serif italic">4.99€</span>
        </button>
        <button onClick={() => onBuy(15)} className="p-6 bg-gold-bright/10 border-2 border-gold-bright/50 rounded-2xl flex justify-between items-center group hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
          <span className="text-gold-bright font-mystic text-2xl font-bold">15 Éclats</span>
          <span className="text-white font-serif italic">12.99€</span>
        </button>
      </div>
      <button onClick={onClose} className="text-gold-muted/60 font-mystic text-xs uppercase tracking-widest">Plus tard</button>
    </div>
  </div>
);

export default App;
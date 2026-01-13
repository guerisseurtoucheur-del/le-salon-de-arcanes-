
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
    {/* Flamme */}
    <div className="relative mb-1">
      <div className="flame-glow w-16 h-16 bg-amber-500/20 rounded-full absolute -top-8 left-1/2 -translate-x-1/2 blur-xl animate-glow-pulse"></div>
      <div className="flame w-4 h-8 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-100 rounded-full blur-[1px] animate-flame-flicker origin-bottom shadow-[0_0_20px_rgba(251,191,36,0.6)]"></div>
    </div>
    {/* Corps de la bougie */}
    <div className="w-6 h-32 bg-gradient-to-b from-[#2a1a0a] via-[#4d3319] to-[#1a0f05] rounded-t-sm shadow-inner relative border-x border-gold-muted/20">
      <div className="absolute top-0 left-0 w-full h-2 bg-black/40 blur-[1px]"></div>
      {/* Coulures de cire */}
      <div className="absolute top-1 left-1 w-1 h-6 bg-[#4d3319] rounded-full opacity-60"></div>
      <div className="absolute top-2 right-2 w-1 h-4 bg-[#4d3319] rounded-full opacity-40"></div>
    </div>
    {/* Support/Bougeoir */}
    <div className="w-12 h-2 bg-gold-muted/40 rounded-full -mt-1 shadow-lg border-b border-gold-bright/10"></div>
    <div className="w-16 h-1 bg-black/60 rounded-full mt-0.5"></div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [time, setTime] = useState(new Date());
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);

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
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
    }

    const chime = new Audio();
    chime.src = 'https://assets.mixkit.co/active_storage/sfx/2367/2367-preview.mp3';
    chime.volume = 0.7;
    chime.load();
    
    chime.play().catch(() => {
      chime.src = 'https://www.soundjay.com/magic/sounds/magic-chime-01.mp3';
      chime.load();
      chime.play().catch(e => console.error("Échec définitif du son d'entrée:", e));
    });

    setIsEntering(true);

    const backgroundMusic = new Audio();
    backgroundMusic.loop = true;
    backgroundMusic.src = AUDIO_THEMES[ViewType.DASHBOARD];
    backgroundMusic.volume = 0;
    backgroundMusic.load();

    setTimeout(() => {
      globalAudioRef.current = backgroundMusic;
      setHasEntered(true);
    }, 1200);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.TAROT: return <TarotRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CRYSTAL_BALL: return <CrystalBallRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.ASTROLOGY: return <AstrologyRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PENDULUM: return <PendulumRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CECIL_DEEP: return <CecileDeepRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.NEXUS: return <NexusRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!hasEntered) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]"></div>
        
        {/* Bougies décoratives */}
        <div className={`absolute inset-0 flex items-center justify-between px-10 md:px-20 lg:px-40 pointer-events-none transition-all duration-1000 ${isEntering ? 'opacity-0 scale-90' : 'animate-in fade-in duration-1000'}`}>
          <Candle className="mb-20" />
          <Candle className="mb-20" />
        </div>

        <div className={`text-center space-y-12 transition-all duration-1000 relative z-10 ${isEntering ? 'opacity-0 scale-110' : 'animate-in fade-in zoom-in duration-1000'}`}>
          <div className="space-y-4">
            <h1 className="text-7xl font-mystic text-gold-bright tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Le Salon de Cécile</h1>
            <p className="text-gold-muted font-cursive text-4xl italic">L'invisible vous attend...</p>
          </div>
          
          <div className="relative inline-block">
            <button 
              onClick={enterSalon}
              disabled={isEntering}
              className="group relative px-16 py-6 bg-transparent border-2 border-gold-bright/30 overflow-hidden rounded-full transition-all hover:border-gold-bright hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] disabled:opacity-0"
            >
              <span className="relative z-10 font-mystic text-gold-bright text-2xl tracking-widest uppercase group-hover:scale-110 block transition-transform">
                Entrer dans le Salon
              </span>
              <div className="absolute inset-0 bg-gold-bright/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>

            {isEntering && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="burst-particle"
                    style={{
                      '--angle': `${i * 18}deg`,
                      '--delay': `${Math.random() * 0.2}s`,
                      '--dist': `${150 + Math.random() * 150}px`
                    } as any}
                  >
                    {['✨', '💎', '✦', '✴️', '⭐'][i % 5]}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Liste des services proposés (Remplaçant la note audio) */}
          <div className="space-y-4 max-w-2xl px-6 animate-pulse">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-bright/30 to-transparent"></div>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 font-mystic text-[11px] md:text-sm text-gold-bright tracking-[0.25em] uppercase">
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Tarot Divinatoire</span>
              <span className="text-gold-muted/40">✦</span>
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Boule de Cristal</span>
              <span className="text-gold-muted/40">✦</span>
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Oracle des Astres</span>
              <span className="text-gold-muted/40">✦</span>
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Pendule Sacré</span>
              <span className="text-gold-muted/40">✦</span>
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Visions Profondes</span>
              <span className="text-gold-muted/40">✦</span>
              <span className="drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">Nexus Quantique</span>
            </div>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold-bright/30 to-transparent"></div>
          </div>
        </div>

        <style>{`
          @keyframes flame-flicker {
            0%, 100% { transform: scaleY(1) scaleX(1) rotate(0deg); }
            25% { transform: scaleY(1.1) scaleX(0.9) rotate(1deg); }
            50% { transform: scaleY(0.95) scaleX(1.05) rotate(-1.5deg); }
            75% { transform: scaleY(1.05) scaleX(0.95) rotate(0.5deg); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.15); }
          }
          .animate-flame-flicker {
            animation: flame-flicker 0.15s ease-in-out infinite;
          }
          .animate-glow-pulse {
            animation: glow-pulse 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="salon-container relative animate-in fade-in duration-1000">
      
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
          <button 
            className={`nav-tab ${currentView === ViewType.TAROT ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.TAROT)}
          >Tarot</button>
          <button 
            className={`nav-tab ${currentView === ViewType.CRYSTAL_BALL ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.CRYSTAL_BALL)}
          >Boule</button>
          <button 
            className={`nav-tab ${currentView === ViewType.ASTROLOGY ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.ASTROLOGY)}
          >Astro</button>
          <button 
            className={`nav-tab ${currentView === ViewType.PENDULUM ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.PENDULUM)}
          >Pendule</button>
          <button 
            className={`nav-tab ${currentView === ViewType.CECIL_DEEP ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.CECIL_DEEP)}
          >Visions</button>
          <button 
            className={`nav-tab ${currentView === ViewType.NEXUS ? 'active' : ''}`}
            onClick={() => setCurrentView(ViewType.NEXUS)}
          >Nexus</button>
        </nav>
      )}

      <main className={`${currentView === ViewType.CRYSTAL_BALL ? '' : 'glass-mystic gold-border'} p-8 rounded-xl animate-fade min-h-[60vh]`}>
        {renderView()}
      </main>

      <footer className="mt-12 text-center text-gold-muted/50 text-sm uppercase tracking-widest">
        L'invisible ne ment jamais • Salon ouvert depuis 2022
      </footer>
    </div>
  );
};

export default App;

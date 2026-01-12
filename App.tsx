
import React, { useState, useEffect } from 'react';
import { ViewType } from './types';
import Dashboard from './components/Dashboard';
import TarotRoom from './components/TarotRoom';
import CrystalBallRoom from './components/CrystalBallRoom';
import AstrologyRoom from './components/AstrologyRoom';
import PendulumRoom from './components/PendulumRoom';
import CecileDeepRoom from './components/CecileDeepRoom';
import NexusRoom from './components/NexusRoom';
import AudioController from './components/AudioController';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [time, setTime] = useState(new Date());

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

  return (
    <div className="salon-container relative">
      <AudioController currentView={currentView} />
      
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

      <main className="glass-mystic gold-border p-8 rounded-xl animate-fade min-h-[60vh]">
        {renderView()}
      </main>

      <footer className="mt-12 text-center text-gold-muted/50 text-sm uppercase tracking-widest">
        L'invisible ne ment jamais • Salon ouvert depuis 2022
      </footer>
    </div>
  );
};

export default App;

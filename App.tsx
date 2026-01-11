
import React, { useState } from 'react';
import { ViewType } from './types';
import Dashboard from './components/Dashboard';
import TarotRoom from './components/TarotRoom';
import CrystalBallRoom from './components/CrystalBallRoom';
import AstrologyRoom from './components/AstrologyRoom';
import PendulumRoom from './components/PendulumRoom';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case ViewType.TAROT: return <TarotRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.CRYSTAL_BALL: return <CrystalBallRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.ASTROLOGY: return <AstrologyRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PENDULUM: return <PendulumRoom onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="salon-container relative">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-mystic text-gold-bright tracking-widest drop-shadow-lg">Le Salon de Cécile</h1>
        <p className="font-cursive text-3xl text-gold-muted mt-2">Voyance & Mystères de l'Âme</p>
      </header>

      {currentView !== ViewType.DASHBOARD && (
        <nav className="flex justify-center gap-4 mb-8">
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
        </nav>
      )}

      <main className="glass-mystic gold-border p-8 rounded-xl animate-fade">
        {renderView()}
      </main>

      <footer className="mt-12 text-center text-gold-muted/50 text-sm uppercase tracking-widest">
        L'invisible ne ment jamais • Salon ouvert depuis 1892
      </footer>
    </div>
  );
};

export default App;

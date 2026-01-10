
import React, { useState } from 'react';
import { ViewType } from './types';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import VoiceView from './components/VoiceView';
import TarotView from './components/TarotView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);

  const renderView = () => {
    switch (activeView) {
      case ViewType.CHAT:
        return <ChatView />;
      case ViewType.IMAGE:
        return <ImageView />;
      case ViewType.VOICE:
        return <VoiceView />;
      case ViewType.TAROT:
        return <TarotView />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#120a07] text-[#d4af37] overflow-hidden">
      {/* Sidebar - Style Velours / Bibliothèque */}
      <nav className="w-full md:w-72 sidebar-velvet p-6 flex flex-col gap-8 md:sticky md:top-0 md:h-screen z-50 shadow-[5px_0_30px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col items-center gap-4 cursor-pointer py-6 border-b border-gold/30" onClick={() => setActiveView(ViewType.DASHBOARD)}>
          <div className="w-16 h-16 wax-seal rounded-full flex items-center justify-center">
            <span className="text-3xl font-serif-ornate font-bold text-white">A</span>
          </div>
          <h1 className="text-xl font-serif-ornate font-bold tracking-wider text-center uppercase leading-tight">
            Le Salon <br/> des Arcanes
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <NavItem 
            active={activeView === ViewType.DASHBOARD} 
            onClick={() => setActiveView(ViewType.DASHBOARD)} 
            label="Grand Hall" 
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
          <NavItem 
            active={activeView === ViewType.TAROT} 
            onClick={() => setActiveView(ViewType.TAROT)} 
            label="Le Petit Oracle" 
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
          <NavItem 
            active={activeView === ViewType.CHAT} 
            onClick={() => setActiveView(ViewType.CHAT)} 
            label="Les Murmures" 
            icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
          <NavItem 
            active={activeView === ViewType.IMAGE} 
            onClick={() => setActiveView(ViewType.IMAGE)} 
            label="Atelier Visionnaire" 
            icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
          <NavItem 
            active={activeView === ViewType.VOICE} 
            onClick={() => setActiveView(ViewType.VOICE)} 
            label="Séance Mystique" 
            icon="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </div>

        <div className="mt-auto pt-6 border-t border-gold/20 text-center">
          <p className="text-[10px] font-serif-ornate uppercase tracking-widest opacity-50">Anno Domini MMXXV</p>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-12 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
        {renderView()}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; label: string; icon: string }> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 group border-l-4 ${
      active 
        ? 'border-gold bg-gold/10 text-gold scale-105' 
        : 'border-transparent hover:border-gold/50 text-[#c9ad81] hover:bg-black/20'
    }`}
  >
    <svg className={`w-6 h-6 transition-transform group-hover:scale-110 ${active ? 'text-gold' : 'text-gold/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
    </svg>
    <span className="font-serif-ornate font-bold text-[11px] md:text-xs tracking-widest uppercase text-left leading-tight">{label}</span>
  </button>
);

export default App;


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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-full md:w-64 glass p-6 flex flex-col gap-8 md:sticky md:top-0 md:h-screen z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView(ViewType.DASHBOARD)}>
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-xl font-serif font-bold text-slate-900">S</span>
          </div>
          <h1 className="text-lg font-serif font-bold tracking-tight text-amber-200">Le Salon des Arcanes</h1>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem 
            active={activeView === ViewType.DASHBOARD} 
            onClick={() => setActiveView(ViewType.DASHBOARD)} 
            label="Accueil" 
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
          <NavItem 
            active={activeView === ViewType.TAROT} 
            onClick={() => setActiveView(ViewType.TAROT)} 
            label="Tirage Oracle" 
            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
          <NavItem 
            active={activeView === ViewType.CHAT} 
            onClick={() => setActiveView(ViewType.CHAT)} 
            label="Consultation Libre" 
            icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
          <NavItem 
            active={activeView === ViewType.IMAGE} 
            onClick={() => setActiveView(ViewType.IMAGE)} 
            label="Visionnaire IA" 
            icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
          <NavItem 
            active={activeView === ViewType.VOICE} 
            onClick={() => setActiveView(ViewType.VOICE)} 
            label="Médium Direct" 
            icon="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center font-serif">Gemini 3 • L'Art Divinatoire</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
        {renderView()}
      </main>
    </div>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-amber-600/10 text-amber-400 border border-amber-600/20' 
        : 'hover:bg-slate-800 text-slate-400'
    }`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
    </svg>
    <span className="font-medium">{label}</span>
  </button>
);

export default App;


import React from 'react';
import { ViewType } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      <header className="space-y-4">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
          Bienvenue au <span className="text-amber-500">Salon des Arcanes</span>
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed italic">
          Où l'intelligence artificielle rencontre les secrets millénaires de la cartomancie. Entrez et laissez les cartes parler.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ToolCard 
          title="Tirage Oracle"
          description="Consultez le Tarot de Marseille ou la Sybille des Salons avec l'Oracle en direct."
          color="bg-amber-700"
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          onClick={() => onNavigate(ViewType.TAROT)}
        />
        <ToolCard 
          title="Consultation IA"
          description="Posez vos questions à notre intelligence visionnaire, connectée aux flux du monde."
          color="bg-slate-800"
          icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          onClick={() => onNavigate(ViewType.CHAT)}
        />
        <ToolCard 
          title="Médium Direct"
          description="Engagez une séance de spiritisme moderne par la voix avec Gemini."
          color="bg-indigo-900"
          icon="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          onClick={() => onNavigate(ViewType.VOICE)}
        />
      </div>

      <section className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
        <h3 className="text-2xl font-serif font-bold mb-4 text-amber-200">Le Saviez-vous ?</h3>
        <p className="text-slate-400">
          La **Sybille des Salons** était très prisée au XIXe siècle. Elle se concentre sur les aspects concrets de la vie : rencontres, nouvelles, famille et travail.
        </p>
      </section>
    </div>
  );
};

interface ToolCardProps {
  title: string;
  description: string;
  color: string;
  icon: string;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, color, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative glass p-8 rounded-3xl text-left hover:scale-[1.02] transition-all duration-300 flex flex-col h-full border border-slate-800 hover:border-amber-500/50"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </div>
    <h4 className="text-2xl font-serif font-bold mb-3 group-hover:text-amber-400 transition-colors">{title}</h4>
    <p className="text-slate-400 leading-relaxed mb-6 flex-grow">{description}</p>
    <div className="flex items-center text-amber-500 font-semibold gap-2 group-hover:gap-3 transition-all">
      <span>Commencer</span>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </div>
  </button>
);

export default Dashboard;

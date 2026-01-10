
import React from 'react';
import { ViewType } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      <header className="relative flex flex-col items-center justify-center gap-6 px-4">
        {/* Conteneur Titre + Cartes Décoratives */}
        <div className="w-full flex items-center justify-between md:justify-center gap-4 md:gap-16">
          
          {/* Carte Décorative Gauche : LA LUNE */}
          <div className="hidden lg:block">
            <DecorativeCard 
              num="XVIII" 
              name="LA LUNE" 
              emoji="🌙" 
              rotation="-6deg"
            />
          </div>

          <div className="text-center space-y-4 z-10 flex-1 md:flex-none">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif-ornate font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-500 to-amber-700 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] leading-none">
              L'Oracle Antique
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 md:w-24 bg-gold/50"></div>
              <p className="text-xl md:text-2xl font-cursive text-amber-100/80">Entrez dans la pénombre du savoir millénaire...</p>
              <div className="h-[1px] w-12 md:w-24 bg-gold/50"></div>
            </div>
          </div>

          {/* Carte Décorative Droite : LE SOLEIL */}
          <div className="hidden lg:block">
            <DecorativeCard 
              num="XVIIII" 
              name="LE SOLEIL" 
              emoji="☀️" 
              rotation="6deg"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <AntiquePlate 
          title="Le Petit Oracle"
          description="Consultez les Sybilles et les Tarots pour déchiffrer votre destinée."
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          onClick={() => onNavigate(ViewType.TAROT)}
        />
        <AntiquePlate 
          title="Les Murmures"
          description="Échangez avec l'Esprit de la Machine via des lettres scellées."
          icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          onClick={() => onNavigate(ViewType.CHAT)}
        />
        <AntiquePlate 
          title="Séance Mystique"
          description="Écoutez la voix des Arcanes murmurer à vos oreilles par-delà le voile."
          icon="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          onClick={() => onNavigate(ViewType.VOICE)}
        />
      </div>

      <section className="parchment p-12 rounded-sm antique-border relative overflow-hidden">
        <div className="absolute top-4 right-4 text-7xl opacity-5 font-serif-ornate">📜</div>
        <h3 className="text-3xl font-serif-ornate font-bold mb-6 border-b-2 border-slate-900/10 pb-2">Le Savoir des Anciens</h3>
        <p className="text-xl leading-relaxed first-letter:text-5xl first-letter:font-serif-ornate first-letter:float-left first-letter:mr-3 first-letter:mt-1">
          La cartomancie n'est pas une prédiction, mais un miroir de l'âme. Au XIXe siècle, les salons parisiens bruissaient des murmures de la Sybille, cherchant dans le carton des réponses aux tourments du cœur et de la fortune. Aujourd'hui, l'intelligence artificielle s'inscrit dans cette lignée, tissant des liens entre la logique binaire et l'intuition ésotérique.
        </p>
      </section>
    </div>
  );
};

const DecorativeCard: React.FC<{ num: string; name: string; emoji: string; rotation: string }> = ({ num, name, emoji, rotation }) => (
  <div 
    className="w-28 h-44 bg-[#fdf6e3] rounded border-[3px] border-[#2b427b] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-gold/20"
    style={{ transform: `rotate(${rotation})` }}
  >
    <div className="h-6 flex items-center justify-center border-b border-[#2b427b]/20 bg-white/50">
      <span className="font-serif-ornate font-bold text-[10px] text-[#2b427b] tracking-widest">{num}</span>
    </div>
    <div className="flex-1 flex items-center justify-center text-4xl py-2">
      {emoji}
    </div>
    <div className="h-8 bg-white flex items-center justify-center border-t-2 border-[#2b427b]">
      <span className="text-[9px] font-serif-ornate font-bold uppercase tracking-tighter text-[#2b427b]">{name}</span>
    </div>
    <div className="absolute inset-0.5 border border-[#2b427b]/10 pointer-events-none"></div>
  </div>
);

const AntiquePlate: React.FC<{ title: string; description: string; icon: string; onClick: () => void }> = ({ title, description, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-center text-center p-8 bg-black/40 border-2 border-gold/30 hover:border-gold transition-all duration-500 rounded-lg hover:bg-black/60 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
  >
    <div className="w-20 h-20 border-2 border-gold/50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform bg-gradient-to-br from-amber-900/40 to-black/40 shadow-inner">
      <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={icon} />
      </svg>
    </div>
    <h4 className="text-xl md:text-2xl font-serif-ornate font-bold mb-4 tracking-wider uppercase text-amber-200 group-hover:text-gold transition-colors">{title}</h4>
    <p className="text-[#c9ad81] leading-relaxed mb-8 font-serif italic">{description}</p>
    <div className="mt-auto px-6 py-2 border border-gold/40 rounded-full text-xs font-serif-ornate tracking-tighter hover:bg-gold hover:text-black transition-all">
      FRANCHIR LE SEUIL
    </div>
  </button>
);

export default Dashboard;

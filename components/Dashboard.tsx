
import React from 'react';
import { ViewType } from '../types';

const PendulumIcon = () => (
  <div className="relative w-20 h-20 flex flex-col items-center group-hover:animate-swing-subtle transition-all duration-700">
    <div className="w-[1px] h-10 bg-gold-muted/60 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.8)_20%,transparent_30%)] bg-[length:4px_6px]"></div>
    </div>
    <div className="relative -mt-1 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
      <svg width="30" height="45" viewBox="0 0 70 110" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 0L70 40L55 90L35 110L15 90L0 40L35 0Z" fill="url(#crystal_grad_icon)" stroke="#1a1510" strokeWidth="1"/>
        <path d="M35 0V110" stroke="white" strokeOpacity="0.4" strokeWidth="0.5"/>
        <defs>
          <linearGradient id="crystal_grad_icon" x1="0" y1="0" x2="70" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.9"/>
            <stop offset="0.4" stopColor="#fdf6e3" stopOpacity="0.6"/>
            <stop offset="1" stopColor="#b8860b" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  tokens: number;
  onOpenShop: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, tokens, onOpenShop }) => {
  const rooms = [
    { type: ViewType.TAROT, label: 'Les Arcanes du Tarot', icon: '🃏', desc: 'Marseille & Rider-Waite' },
    { type: ViewType.CRYSTAL_BALL, label: 'La Boule de Cristal', icon: '🔮', desc: 'Visions du Futur Proche' },
    { type: ViewType.ASTROLOGY, label: 'L\'Oracle des Astres', icon: '✨', desc: 'Votre Destin dans les Étoiles' },
    { type: ViewType.PENDULUM, label: 'Le Sanctuaire du Pendule', icon: <PendulumIcon />, desc: 'Vérité par le Oui ou le Non' },
    { type: ViewType.CECIL_DEEP, label: 'Cécile éclaire votre Futur', icon: '👁️', desc: 'Révélations profondes sur votre Destinée' },
    { type: ViewType.NEXUS, label: 'Le Nexus de Nano', icon: '🔷', desc: 'Intelligence Cyber-Mystique' },
  ];

  return (
    <div className="space-y-12">
      {/* Message d'accueil conditionnel */}
      {tokens === 0 && (
        <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <p className="text-gold-muted text-sm font-serif italic">Vos éclats sont épuisés. Consultez la boutique pour poursuivre votre quête.</p>
           </div>
           <button onClick={onOpenShop} className="px-6 py-2 bg-gold-bright text-black font-mystic text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all">Boutique</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <button
            key={room.type}
            onClick={() => onNavigate(room.type)}
            className={`group relative p-10 bg-gradient-to-br from-purple-950/60 to-black/80 border-2 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(184,134,11,0.2)] ${tokens > 0 ? 'border-gold-muted/30 hover:border-gold-bright' : 'border-red-900/20 grayscale opacity-80'}`}
          >
            {/* Token Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full border flex items-center gap-2 transition-all ${tokens > 0 ? 'border-gold-bright/30 bg-gold-bright/10 text-gold-bright' : 'border-red-500/30 bg-red-900/10 text-red-400'}`}>
               <span className="text-[10px] font-mystic uppercase tracking-widest">Coût: 1 Éclat</span>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px] group-hover:bg-purple-600/20 transition-all"></div>
            
            <div className="flex flex-col items-center gap-6 relative z-10">
              <span className="text-7xl group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                {room.icon}
              </span>
              <div className="text-center">
                <h3 className="text-2xl font-mystic text-gold-bright mb-2 tracking-wide group-hover:translate-x-2 transition-transform">{room.label}</h3>
                <p className="text-gold-muted/80 font-serif italic text-base">{room.desc}</p>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
              <span className="text-gold-bright font-mystic flex items-center gap-2">
                {tokens > 0 ? 'Entrer' : 'Verrouillé'} <span className="text-xl">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

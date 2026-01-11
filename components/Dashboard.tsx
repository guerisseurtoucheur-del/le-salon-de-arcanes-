
import React from 'react';
import { ViewType } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const rooms = [
    { type: ViewType.TAROT, label: 'Les Arcanes du Tarot', icon: '🃏', desc: 'Marseille & Rider-Waite' },
    { type: ViewType.CRYSTAL_BALL, label: 'La Boule de Cristal', icon: '🔮', desc: 'Visions du Futur Proche' },
    { type: ViewType.ASTROLOGY, label: 'L\'Oracle des Astres', icon: '✨', desc: 'Votre Destin dans les Étoiles' },
    { type: ViewType.PENDULUM, label: 'Le Sanctuaire du Pendule', icon: '⚓', desc: 'Vérité par le Oui ou le Non' },
    { type: ViewType.NEXUS, label: 'Le Nexus de Nano', icon: '🔷', desc: 'Sagesse Cosmique et Logique' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
      {rooms.map((room) => (
        <button
          key={room.type}
          onClick={() => onNavigate(room.type)}
          className="group relative p-10 bg-gradient-to-br from-purple-950/60 to-black/80 border-2 border-gold-muted/30 rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold-bright hover:shadow-[0_0_40px_rgba(184,134,11,0.2)]"
        >
          {/* Decorative background glow */}
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
              Entrer <span className="text-xl">→</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Dashboard;

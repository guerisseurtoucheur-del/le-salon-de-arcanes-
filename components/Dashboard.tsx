
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
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {rooms.map((room) => (
        <button
          key={room.type}
          onClick={() => onNavigate(room.type)}
          className="group relative p-8 bg-black/40 border border-gold-muted/30 rounded-lg overflow-hidden transition-all hover:border-gold-bright hover:bg-black/60"
        >
          <div className="flex items-center gap-6">
            <span className="text-6xl group-hover:scale-110 transition-transform">{room.icon}</span>
            <div className="text-left">
              <h3 className="text-2xl font-mystic text-gold-bright">{room.label}</h3>
              <p className="text-gold-muted/70 italic">{room.desc}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-gold-bright">Entrer →</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { ViewType } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
  tokens: number;
  onOpenShop: () => void;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
}

const PendulumIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="5" r="3" fill="currentColor" />
    <path d="M50 5 L50 60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M50 60 L65 80 L50 100 L35 80 Z" fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, tokens, onOpenShop, setTokens }) => {
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  useEffect(() => {
    const lastClaim = localStorage.getItem('last_mystic_bonus');
    const now = Date.now();
    if (!lastClaim || now - parseInt(lastClaim) > 24 * 60 * 60 * 1000) {
      setCanClaimBonus(true);
    }
  }, []);

  const claimBonus = () => {
    setTokens(prev => prev + 1);
    localStorage.setItem('last_mystic_bonus', Date.now().toString());
    setCanClaimBonus(false);
    setBonusClaimed(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    audio.play();
  };

  const rooms = [
    { type: ViewType.TAROT, label: "L'Oracle de Cécile", icon: "🃏", desc: 'Le destin gravé dans les Arcanes.' },
    { type: ViewType.CRYSTAL_BALL, label: 'Miroir des Visions', icon: '🔮', desc: 'Ce qui est caché sera révélé.' },
    { type: ViewType.ASTROLOGY, label: 'Cercle des Astres', icon: '✨', desc: 'Alignez votre âme sur le Cosmos.' },
    { type: ViewType.PENDULUM, label: 'Sanctuaire du Pendule', icon: <PendulumIcon className="w-16 h-16 text-gold-bright" />, desc: 'La vérité par l\'oscillation.' },
    { type: ViewType.CECIL_DEEP, label: 'Visions Profondes', icon: '👁️', desc: 'Révélations sur votre âme.' },
    { type: ViewType.GRIMOIRE, label: 'Le Grimoire', icon: '📖', desc: 'Relisez vos prophéties passées.' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {canClaimBonus && (
        <div className="bg-gradient-to-r from-gold-bright/10 to-transparent border border-gold-bright/30 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(255,215,0,0.1)]">
           <div className="flex items-center gap-6">
              <span className="text-6xl animate-bounce">🎁</span>
              <div>
                <h3 className="text-2xl font-mystic text-gold-bright uppercase tracking-widest">Rituel Quotidien</h3>
                <p className="text-gold-muted font-serif-elegant italic text-lg">Un éclat de lumière vous est offert pour votre fidélité.</p>
              </div>
           </div>
           <button onClick={claimBonus} className="px-10 py-4 bg-gold-bright text-black font-mystic text-sm uppercase tracking-widest rounded-full hover:scale-110 shadow-xl transition-all animate-pulse">
              Réclamer mon Éclat
           </button>
        </div>
      )}

      {bonusClaimed && (
        <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-full animate-in zoom-in">
          <p className="text-green-400 font-mystic text-xs uppercase tracking-widest">L'éclat a été ajouté à votre bourse. Revenez demain !</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <button
            key={room.type}
            onClick={() => onNavigate(room.type)}
            className={`group relative p-10 bg-black/60 border-2 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] ${tokens > 0 || room.type === ViewType.GRIMOIRE ? 'border-gold-muted/30 hover:border-gold-bright' : 'border-red-900/20 grayscale opacity-80'}`}
          >
            <div className="flex flex-col items-center gap-6">
              <div className="transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6">
                {typeof room.icon === 'string' ? <span className="text-7xl">{room.icon}</span> : room.icon}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-mystic text-gold-bright mb-2 tracking-wide uppercase">{room.label}</h3>
                <p className="text-gold-muted/80 font-serif-elegant italic text-lg">{room.desc}</p>
              </div>
            </div>
            <div className="absolute top-4 right-6 font-mystic text-[10px] text-gold-muted/40 uppercase tracking-widest">
              {room.type === ViewType.GRIMOIRE ? 'Accès Libre' : '1 Éclat'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { getPrediction, generateVisionImage } from '../services/geminiService';

const CrystalBallRoom: React.FC<{ onBack: () => void }> = () => {
  const [query, setQuery] = useState('');
  const [prediction, setPrediction] = useState('');
  const [visionUrl, setVisionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVision = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPrediction('');
    setVisionUrl(null);
    try {
      const p = await getPrediction(query);
      setPrediction(p || '');
      const img = await generateVisionImage(p || '');
      setVisionUrl(img);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 py-8">
      <div className="text-center space-y-2 mb-4 animate-fade">
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Miroir de l'Âme</h2>
        <p className="text-gold-muted font-cursive text-2xl italic">L'avenir n'est qu'un reflet qui attend d'être révélé.</p>
      </div>

      <div className="relative group">
        <div className="crystal-ball transition-all duration-1000 group-hover:scale-105 group-hover:shadow-[0_0_150px_rgba(139,92,246,0.6)]">
          <div className="mist"></div>
          {visionUrl && <img src={visionUrl} className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-screen animate-fade zoom-anim" />}
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20">
               <div className="w-24 h-24 border-4 border-gold-muted/30 border-t-gold-bright rounded-full animate-spin mb-6"></div>
               <span className="font-mystic text-gold-bright text-xl tracking-widest animate-pulse">INCANTATION...</span>
            </div>
          )}
        </div>
        
        {/* Base of crystal ball */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-t from-black to-gold-muted/40 rounded-t-full border-t-2 border-gold-muted/50 z-0"></div>
      </div>

      <div className="w-full max-w-xl space-y-6 z-10 px-4">
        <textarea 
          placeholder="De quoi s'inquiète votre âme ? Murmurez-le ici..."
          className="w-full bg-black/60 border-2 border-gold-muted/30 p-6 rounded-2xl text-gold-bright text-2xl font-serif italic placeholder:text-gold-muted/20 focus:outline-none focus:border-gold-bright focus:shadow-[0_0_30px_rgba(184,134,11,0.2)] transition-all resize-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />
        <button 
          onClick={handleVision}
          disabled={loading || !query.trim()}
          className="w-full py-6 bg-gradient-to-r from-purple-950 to-purple-800 border-2 border-gold-muted text-gold-bright font-mystic text-2xl tracking-widest hover:scale-[1.03] hover:from-purple-800 hover:to-purple-700 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-2xl rounded-xl uppercase"
        >
          Fixer l'Abîme
        </button>
      </div>

      {prediction && (
        <div className="max-w-3xl p-10 glass-mystic gold-border rounded-[2rem] animate-in fade-in slide-in-from-top-8 duration-1000 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
          <div className="flex justify-center mb-6">
             <span className="text-4xl text-gold-bright opacity-40">✦ ✦ ✦</span>
          </div>
          <p className="italic text-3xl md:text-4xl text-gold-bright font-cursive leading-relaxed text-center px-4 drop-shadow-md">
            "{prediction}"
          </p>
        </div>
      )}
    </div>
  );
};

export default CrystalBallRoom;
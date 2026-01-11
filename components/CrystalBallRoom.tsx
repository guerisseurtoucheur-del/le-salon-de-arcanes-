
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
    <div className="flex flex-col items-center gap-8">
      <div className="crystal-ball group">
        <div className="mist"></div>
        {visionUrl && <img src={visionUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen animate-fade" />}
        {loading && <div className="absolute inset-0 flex items-center justify-center font-mystic animate-pulse">L'avenir se dessine...</div>}
      </div>

      <div className="w-full max-w-md space-y-4">
        <textarea 
          placeholder="De quoi s'inquiète votre âme ? (Ex: Mon futur professionnel, une rencontre...)"
          className="w-full bg-black/40 border border-gold-muted/50 p-4 text-gold-bright placeholder:text-gold-muted/30 focus:outline-none focus:border-gold-bright"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />
        <button 
          onClick={handleVision}
          disabled={loading}
          className="w-full py-4 bg-purple-900 border-2 border-gold-muted text-gold-bright font-mystic hover:bg-purple-800 disabled:opacity-50"
        >
          Fixer la Boule de Cristal
        </button>
      </div>

      {prediction && (
        <div className="max-w-2xl p-6 border-l-4 border-gold-bright bg-black/40 animate-fade">
          <p className="italic text-xl leading-relaxed">"{prediction}"</p>
        </div>
      )}
    </div>
  );
};

export default CrystalBallRoom;

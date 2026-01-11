
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { generateImage } from '../services/geminiService';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const url = await generateImage(prompt);
      setCurrentImage(url);
      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt: prompt.trim(),
        timestamp: Date.now()
      };
      setHistory(prev => [newImg, ...prev]);
    } catch (error) {
      console.error(error);
      alert("Échec de la génération. Essayez un autre prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `cecile-${fileName.substring(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="glass p-8 rounded-3xl border border-slate-800 shadow-xl">
        <h3 className="text-2xl font-serif-ornate font-bold mb-6 text-gold">Studio Image Cécile</h3>
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Un portrait mystique de Cécile dans son salon, style peinture à l'huile du XIXe siècle..."
            className="flex-1 bg-slate-900/60 border border-gold/20 rounded-xl px-5 py-4 text-gold focus:outline-none focus:border-gold transition-all placeholder:text-gold/30 font-serif"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 disabled:from-slate-800 disabled:to-slate-900 text-gold font-serif-ornate font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap border border-gold/30"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                Visions en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Invoquer l'Image
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentImage ? (
            <div className="glass rounded-3xl overflow-hidden shadow-2xl group relative border-2 border-gold/20">
              <img src={currentImage} alt="Vision de Cécile" className="w-full aspect-square object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-gold font-serif italic mb-4">"{prompt}"</p>
                <button 
                  onClick={() => downloadImage(currentImage, prompt)}
                  className="bg-gold/20 hover:bg-gold/40 backdrop-blur-md text-gold border border-gold/30 px-4 py-2 rounded-lg font-serif-ornate text-xs tracking-widest flex items-center gap-2 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  GARDER LA VISION
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-square glass rounded-3xl border-2 border-dashed border-gold/10 flex flex-col items-center justify-center text-gold/20 space-y-4">
               <svg className="w-20 h-20 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl font-serif italic">Fixez le vide, l'image apparaîtra...</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-serif-ornate font-bold flex items-center gap-2 text-gold/80">
            <svg className="w-5 h-5 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            VISIONS PASSÉES
          </h4>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-gold/20 italic font-serif">La galerie est encore dans l'ombre...</p>
            ) : (
              history.map((img) => (
                <div 
                  key={img.id} 
                  className="glass p-3 rounded-2xl border border-gold/5 hover:border-gold/30 cursor-pointer transition-all flex items-center gap-4 group"
                  onClick={() => {
                    setCurrentImage(img.url);
                    setPrompt(img.prompt);
                  }}
                >
                  <img src={img.url} className="w-20 h-20 rounded-xl object-cover border border-gold/10" alt="Archive" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gold/60 font-serif italic truncate">{img.prompt}</p>
                    <p className="text-[10px] text-gold/30 font-serif mt-1">{new Date(img.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageView;

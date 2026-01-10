
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
    link.download = `nexus-${fileName.substring(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="glass p-8 rounded-3xl border border-slate-800 shadow-xl">
        <h3 className="text-2xl font-bold mb-6">Studio Image Nexus</h3>
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Un lion cybernétique rôdant dans une jungle néon, résolution 8k, éclairage cinématographique..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Génération...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Créer l'œuvre
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentImage ? (
            <div className="glass rounded-3xl overflow-hidden shadow-2xl group relative">
              <img src={currentImage} alt="Résultat généré" className="w-full aspect-square object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-medium mb-4 italic">"{prompt}"</p>
                <button 
                  onClick={() => downloadImage(currentImage, prompt)}
                  className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger PNG
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-square glass rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 space-y-4">
               <svg className="w-20 h-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xl">Votre création apparaîtra ici</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historique récent
          </h4>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-slate-500 italic">Aucune image pour le moment...</p>
            ) : (
              history.map((img) => (
                <div 
                  key={img.id} 
                  className="glass p-3 rounded-2xl border border-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all flex items-center gap-4 group"
                  onClick={() => {
                    setCurrentImage(img.url);
                    setPrompt(img.prompt);
                  }}
                >
                  <img src={img.url} className="w-20 h-20 rounded-xl object-cover" alt="History" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 font-medium truncate">{img.prompt}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(img.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

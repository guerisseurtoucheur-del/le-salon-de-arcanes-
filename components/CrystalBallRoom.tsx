
import React, { useState, useRef, useEffect } from 'react';
import { getPrediction, generateVisionImage, generateSpeech, decodeAudio, decodeAudioData } from '../services/geminiService';
import { saveHistoryEntry } from '../services/historyService';
import { ViewType } from '../types';

const CrystalBallRoom: React.FC<{ onBack: () => void }> = () => {
  const [step, setStep] = useState<'identity' | 'vision'>('identity');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [query, setQuery] = useState('');
  const [prediction, setPrediction] = useState('');
  const [visionUrl, setVisionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    playSpeech("Approchez... Laissez le miroir déchirer le voile !");
    return () => sourceRef.current?.stop();
  }, []);

  const playSpeech = async (text: string) => {
    try {
      const audioPromise = generateSpeech(text);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      const audioData = await audioPromise;
      if (audioData) {
        setIsSpeaking(true);
        const buffer = await decodeAudioData(decodeAudio(audioData), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        sourceRef.current?.stop();
        sourceRef.current = source;
        source.start();
      }
    } catch (e) { setIsSpeaking(false); }
  };

  const handleVision = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setPrediction('');
    setVisionUrl(null);
    try {
      const p = await getPrediction(query, { age, birthDate });
      setPrediction(p || '');
      setLoading(false);
      playSpeech(p || '');
      const img = await generateVisionImage(p || '');
      setVisionUrl(img);
      if (p) {
        saveHistoryEntry({
          type: ViewType.CRYSTAL_BALL,
          title: "Visions du Miroir",
          content: p,
          image: img || undefined
        });
      }
    } catch (e) { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-700">
      <div className="text-center space-y-2 mb-2">
        <h2 className="text-4xl font-mystic text-gold-bright uppercase tracking-widest">Le Miroir de l'Âme</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">L'avenir n'est qu'un reflet qui attend d'être révélé.</p>
      </div>

      <div className="relative group perspective-1000 cursor-pointer" onClick={() => step === 'vision' && query.trim() && handleVision()}>
        <div className={`relative w-72 h-72 md:w-80 md:h-80 rounded-full crystal-container transition-all duration-700 z-10 flex items-center justify-center overflow-hidden border-4 ${isSpeaking || visionUrl ? 'border-gold-bright shadow-[0_0_150px_rgba(255,215,0,0.7)]' : 'border-gold-muted/20 shadow-[0_0_80px_rgba(139,92,246,0.3)]'}`}>
          <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.4)_0%,transparent_70%)] animate-swirl-slow ${isSpeaking || visionUrl ? 'opacity-100 scale-125' : 'opacity-60 scale-100'}`}></div>
            {visionUrl && <img src={visionUrl} className="absolute inset-0 w-full h-full object-cover mix-blend-lighten animate-in zoom-in duration-[1500ms]" alt="Vision" />}
            {!visionUrl && !loading && step === 'vision' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 animate-pulse pointer-events-none">
                <span className="text-5xl text-gold-bright/60 mb-2">✨</span>
                <span className="font-mystic text-gold-muted text-[10px] uppercase tracking-[0.3em] bg-black/40 px-3 py-1 rounded-full border border-gold-muted/20">Fixer l'Abîme</span>
              </div>
            )}
          </div>
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 backdrop-blur-sm z-40">
               <div className="w-12 h-12 border-4 border-gold-muted/20 border-t-gold-bright rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {step === 'identity' ? (
        <form onSubmit={(e) => { e.preventDefault(); setStep('vision'); }} className="w-full max-w-sm space-y-6 glass-mystic p-8 rounded-3xl border border-gold-muted/30">
          <input type="number" required value={age} onChange={(e) => setAge(e.target.value)} placeholder="Votre Âge" className="w-full bg-black/40 border border-gold-muted/20 p-4 rounded-xl text-gold-bright font-serif" />
          <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full bg-black/40 border border-gold-muted/20 p-4 rounded-xl text-gold-bright font-serif" />
          <button type="submit" className="w-full py-4 bg-purple-900/40 border border-gold-muted text-gold-bright font-mystic text-sm uppercase">Entrer dans le Cercle</button>
        </form>
      ) : (
        <div className="w-full max-w-lg space-y-4 z-10 px-4">
          <textarea placeholder="Quelle ombre vous tourmente ?" className="w-full bg-black/80 border border-gold-muted/20 p-5 rounded-2xl text-gold-bright text-xl font-serif-elegant italic" value={query} onChange={(e) => setQuery(e.target.value)} rows={2} />
          <button onClick={handleVision} disabled={loading || !query.trim()} className="w-full py-4 bg-gradient-to-r from-purple-950 to-purple-800 border border-gold-muted text-gold-bright font-mystic text-lg uppercase shadow-xl rounded-xl">Fixer l'Abîme</button>
          {prediction && (
            <div className="p-8 glass-mystic gold-border rounded-3xl animate-in fade-in duration-700">
              <p className="italic text-2xl md:text-3xl text-gold-bright font-sensual leading-relaxed text-center">"{prediction}"</p>
            </div>
          )}
        </div>
      )}
      <style>{` @keyframes swirl-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .animate-swirl-slow { animation: swirl-slow 40s linear infinite; } .crystal-container { background: radial-gradient(circle at 30% 30%, #3a1e4e, #0a0a0a); } `}</style>
    </div>
  );
};

export default CrystalBallRoom;

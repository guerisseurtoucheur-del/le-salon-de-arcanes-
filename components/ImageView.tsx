
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { generateImage, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { GoogleGenAI, Modality } from '@google/genai';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // États pour la voix
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'repos' | 'connexion' | 'écoute' | 'réponse'>('repos');
  const [lastTranscript, setLastTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
      alert("La vision s'est troublée. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startVoiceSession = async () => {
    setVoiceStatus('connexion');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setVoiceStatus('écoute');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ 
                  media: { 
                    data: encodeAudio(new Uint8Array(int16.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  } 
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setPrompt(prev => {
                const newPrompt = prev ? `${prev} ${text}` : text;
                return newPrompt;
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              setVoiceStatus('réponse');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setVoiceStatus('écoute');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopVoiceSession(),
          onerror: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile. Tu as une voix jeune, claire et une diction parfaitement distincte. Ton rôle est d'aider l'utilisateur à décrire sa vision. Sois inspirante et précise dans tes mots, en articulant bien pour être parfaitement comprise. Tu parles d'une voix lumineuse et cristalline.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          inputAudioTranscription: {},
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setVoiceStatus('repos');
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    setIsVoiceActive(false);
    setVoiceStatus('repos');
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `vision-cecile-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4 flex flex-col items-center">
      <div className="text-center space-y-2">
        <h3 className="text-4xl font-serif-ornate font-bold text-gold tracking-[0.2em] uppercase">L'Atelier Visionnaire de Cécile</h3>
        <p className="text-amber-100/40 font-serif italic">Invoquez des images depuis le monde des ombres...</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          <div className="glass p-6 rounded-2xl border border-gold/20 shadow-xl space-y-6 relative overflow-hidden">
            {isVoiceActive && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse"></div>
            )}
            
            <div className="flex justify-between items-center border-b border-gold/10 pb-2">
              <h4 className="text-sm font-serif-ornate font-bold text-gold uppercase tracking-widest">Formuler l'Invocation</h4>
              <button 
                onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isVoiceActive 
                    ? 'bg-red-900/40 text-red-400 border border-red-500/50 animate-pulse' 
                    : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'
                }`}
                title={isVoiceActive ? "Cesser de parler" : "Parler à Cécile"}
              >
                {voiceStatus === 'connexion' ? (
                  <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isVoiceActive ? "Cécile vous écoute... Parlez-lui de votre vision." : "Décrivez votre vision..."}
                  rows={4}
                  className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-gold focus:outline-none transition-all placeholder:text-gold/20 font-serif resize-none ${
                    isVoiceActive ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-gold/20 focus:border-gold'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 disabled:from-slate-800 disabled:to-slate-900 text-gold font-serif-ornate font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 border border-gold/30 group"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin"></div>
                    Concentration...
                  </>
                ) : (
                  <>
                    <span className="group-hover:rotate-45 transition-transform duration-500 text-xl">✨</span>
                    INVOQUER LA VISION
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col items-center justify-center order-1 lg:order-2">
          <div className={`relative float-anim transition-transform duration-500 ${isVoiceActive ? 'scale-105' : ''}`}>
            <div className={`relative w-80 h-80 md:w-[450px] md:h-[450px] rounded-full overflow-hidden border-[6px] transition-all duration-1000 z-10 group ${
              isVoiceActive ? 'border-gold shadow-[0_0_120px_rgba(212,175,55,0.4)]' : 'border-gold/10 shadow-[0_0_100px_rgba(212,175,55,0.2)]'
            }`}>
              <div className="absolute inset-0 bg-black"></div>
              <div className="absolute inset-2 rounded-full overflow-hidden flex items-center justify-center">
                {currentImage ? (
                  <img src={currentImage} alt="Vision" className="w-full h-full object-cover animate-in zoom-in duration-1000" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gold/20">
                    <span className="text-6xl animate-pulse">🔮</span>
                    <p className="font-serif italic text-sm">Le vide attend vos pensées...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageView;


import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { TarotCard } from '../types';

const ORACLE_CARDS: TarotCard[] = [
  { name: "La Destinée", image: "🗝️", meaning: "Le chemin tracé, les opportunités à saisir." },
  { name: "L'Élévation", image: "🧗", meaning: "Une progression spirituelle ou sociale imminente." },
  { name: "La Réussite", image: "🏆", meaning: "Le couronnement de vos efforts." },
  { name: "L'Inconstance", image: "🌪️", meaning: "Une période de doutes et de changements rapides." },
  { name: "La Pensée", image: "💭", meaning: "Un projet qui mûrit dans l'ombre." },
  { name: "Le Cadeau", image: "🎁", meaning: "Une surprise inattendue, une aide providentielle." },
  { name: "La Fidélité", image: "🐕", meaning: "Un soutien indéfectible de votre entourage." },
  { name: "L'Union", image: "💍", meaning: "Un engagement fort, amoureux ou professionnel." },
  { name: "Le Voyage", image: "🚢", meaning: "Un déplacement nécessaire pour votre évolution." },
  { name: "La Maison", image: "🏠", meaning: "La stabilité retrouvée, le foyer protecteur." },
  { name: "L'Argent", image: "💰", meaning: "Une amélioration matérielle substantielle." },
  { name: "Le Malheur", image: "🥀", meaning: "Une fin de cycle, nécessaire pour renaître." },
  { name: "L'Espoir", image: "🌟", meaning: "La lumière au bout du tunnel." },
  { name: "La Rencontre", image: "🤝", meaning: "Une personne clé va croiser votre route." },
  { name: "Le Secret", image: "🤫", meaning: "Une vérité cachée va éclater." },
];

const TarotRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState<'drawing' | 'flipping' | 'interpreting'>('drawing');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const welcome = "Bienvenue dans mon sanctuaire. L'Oracle de Cécile est prêt. Concentrez-vous sur l'énergie qui vous entoure et choisissez trois cartes pour poser les bases de votre destin.";
    startVoiceSession(welcome);
    
    return () => {
      stopVoiceSession();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const startVoiceSession = async (initialPrompt?: string) => {
    if (sessionRef.current) {
      if (initialPrompt) sessionRef.current.sendRealtimeInput({ parts: [{ text: initialPrompt }] });
      return;
    }

    setVoiceStatus('connecting');
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
            setVoiceStatus('listening');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            if (initialPrompt) sessionPromise.then(s => s.sendRealtimeInput({ parts: [{ text: initialPrompt }] }));
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
                setTranscript(prev => {
                    const newText = message.serverContent.outputTranscription.text;
                    return prev.endsWith(newText) ? prev : prev + newText;
                });
            }
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current && outputContextRef.current.state !== 'closed') {
              setVoiceStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setVoiceStatus('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setVoiceStatus('idle'),
          onerror: () => setVoiceStatus('idle')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une cartomancienne experte. RÉPONDS TOUJOURS EN FRANÇAIS. Ton ton est chaleureux, mystérieux et très intuitif. L'utilisateur utilise 'L'Oracle de Cécile'. Analyse les 3 premières cartes comme le Passé, le Présent et le Futur. Puis invite-le à tirer jusqu'à 3 cartes de précision.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { setVoiceStatus('idle'); }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputContextRef.current) outputContextRef.current.close().catch(() => {});
  };

  const drawCard = (card: TarotCard) => {
    if (selectedCards.length >= 6 || selectedCards.find(c => c.name === card.name)) return;
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});

    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);

    if (step === 'interpreting') {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
      startVoiceSession(`Une nouvelle carte de précision : ${card.name}. Écoutons ce que l'Oracle ajoute à votre histoire.`);
    } else if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Les trois piliers de votre destin sont posés. Retournez-les un à un.");
    }
  };

  const flipCard = (index: number) => {
    if (step !== 'flipping' || flippedIndices.has(index)) return;
    const newFlipped = new Set(flippedIndices);
    newFlipped.add(index);
    setFlippedIndices(newFlipped);
    
    if (newFlipped.size === 3 && step === 'flipping') {
      setStep('interpreting');
      const names = selectedCards.map(c => c.name).join(', ');
      startVoiceSession(`L'Oracle parle de ${names}. Voici ma vision... N'hésitez pas à tirer d'autres cartes ensuite.`);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-start space-y-6 md:space-y-10 pb-32 pt-4 md:pt-8 overflow-x-hidden">
      {/* Voice Status Indicator - Mobile Optimized */}
      <div className={`fixed top-16 md:top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 md:gap-4 px-6 md:px-8 py-2 md:py-3 bg-black/90 backdrop-blur-3xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-105' : 'border-gold-muted/20 scale-100'}`}>
        <div className="flex gap-1 items-end h-4 md:h-5">
           {[...Array(6)].map((_, i) => (
             <div 
               key={i} 
               className={`w-0.5 md:w-1 bg-gold-bright rounded-full transition-all duration-300 ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`}
               style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px', animationDelay: `${i * 0.1}s` }}
             ></div>
           ))}
        </div>
        <span className="font-mystic text-[9px] md:text-xs text-gold-bright uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap">
          {voiceStatus === 'speaking' ? "Cécile interprète..." : "L'Oracle est prêt"}
        </span>
      </div>

      {/* Main Spread Area - Responsive Grid */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-4 md:gap-8 px-4 min-h-[300px] md:min-h-[400px]">
        {selectedCards.map((card, i) => (
          <div 
              key={i} 
              onClick={() => flipCard(i)} 
              className={`w-28 h-44 md:w-48 md:h-72 cursor-pointer perspective-1000 group transition-all duration-1000 animate-in zoom-in-50 slide-in-from-bottom-20 ${flippedIndices.has(i) ? 'rotate-y-180' : 'hover:-translate-y-2 md:hover:-translate-y-4'}`}
          >
            <div className="relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-xl md:rounded-2xl overflow-hidden border border-gold-muted/20">
              {/* Back of the card */}
              <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center p-2 md:p-4">
                 <div className="w-full h-full border border-gold-bright/10 rounded-lg md:rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.05)_0%,transparent_70%)] animate-pulse"></div>
                    <span className="text-3xl md:text-5xl text-gold-bright/30">👁️</span>
                 </div>
              </div>
              {/* Front of the card */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-2 md:p-4 flex flex-col items-center justify-between border-2 md:border-4 border-gold-muted shadow-2xl">
                 <div className="text-amber-950/20 font-mystic text-[8px] md:text-[10px] uppercase tracking-widest">Oracle de Cécile</div>
                 <div className="flex-1 flex flex-col items-center justify-center gap-2 md:gap-4">
                    <span className="text-4xl md:text-8xl filter drop-shadow-md">{card.image}</span>
                    <h4 className="text-center font-mystic text-[10px] md:text-lg text-amber-950 uppercase tracking-[0.1em] md:tracking-[0.2em] border-b border-amber-900/10 pb-1 md:pb-2 leading-tight">{card.name}</h4>
                 </div>
                 <p className="text-[7px] md:text-[10px] text-amber-900/60 font-serif italic text-center px-1 md:px-2 leading-none md:leading-normal">{card.meaning}</p>
              </div>
            </div>
          </div>
        ))}
        {/* Placeholder logic for mobile to keep layout clean */}
        {selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
           <div key={i} className="w-28 h-44 md:w-48 md:h-72 rounded-xl md:rounded-2xl border-2 border-dashed border-gold-muted/10 flex items-center justify-center opacity-20">
              <span className="font-mystic text-[8px] md:text-xs text-gold-muted uppercase">Pilier {selectedCards.length + i + 1}</span>
           </div>
        ))}
      </div>

      {/* Interpretation Parchment - Mobile Optimized */}
      {step === 'interpreting' && (
        <div className="w-full max-w-4xl px-4 animate-in fade-in duration-1000 pb-10">
            <div className="parchment p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] shadow-2xl antique-border relative group overflow-hidden">
                <div className="prose prose-stone max-w-none relative z-10">
                    <p className="italic text-xl md:text-4xl text-amber-950 font-serif leading-relaxed first-letter:text-5xl md:first-letter:text-7xl first-letter:font-mystic first-letter:mr-2 md:first-letter:mr-4 first-letter:float-left first-letter:text-amber-900 drop-shadow-sm">
                       {transcript || "L'Oracle entre en communion..."}
                    </p>
                </div>
                {selectedCards.length < 6 && (
                   <div className="mt-6 md:mt-12 pt-4 md:pt-8 border-t border-amber-950/10 text-center animate-pulse">
                      <p className="font-mystic text-[8px] md:text-xs text-amber-900/50 uppercase tracking-[0.2em] md:tracking-[0.4em]">Piochez une carte de précision pour approfondir</p>
                   </div>
                )}
            </div>
        </div>
      )}

      {/* The Deck Spread - Responsive Fan */}
      {(step === 'drawing' || (step === 'interpreting' && selectedCards.length < 6)) && (
        <div className="w-full flex flex-col items-center space-y-4 md:space-y-12 pb-10">
          <div className="text-center space-y-1">
             <h3 className="font-mystic text-gold-bright text-[10px] md:text-sm uppercase tracking-[0.3em] md:tracking-[0.6em]">L'Eventail des Possibles</h3>
             <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent via-gold-bright/40 to-transparent mx-auto"></div>
          </div>
          
          <div className="relative w-full max-w-5xl h-36 md:h-48 flex justify-center items-end px-4 md:px-10 overflow-x-auto no-scrollbar">
            <div className="flex relative w-fit mx-auto min-w-full justify-center">
              {ORACLE_CARDS.map((card, i) => {
                const isSelected = selectedCards.find(c => c.name === card.name);
                // Adjust rotation for mobile to keep cards within view
                const factor = isMobile ? 4 : 6;
                const spacing = isMobile ? 12 : 25;
                const rotation = (i - (ORACLE_CARDS.length / 2)) * factor;
                const translateX = (i - (ORACLE_CARDS.length / 2)) * spacing;
                
                return (
                  <button 
                    key={i} 
                    onClick={() => drawCard(card)} 
                    disabled={!!isSelected}
                    className={`absolute w-16 h-28 md:w-32 md:h-52 back-oracle rounded-lg md:rounded-xl shadow-xl border border-gold-muted/30 transition-all duration-500 hover:-translate-y-6 md:hover:-translate-y-12 hover:scale-110 active:scale-95 flex items-center justify-center ${isSelected ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100'}`}
                    style={{ 
                      transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
                      transformOrigin: 'bottom center',
                      zIndex: i
                    }}
                  >
                    <span className="text-xl md:text-2xl opacity-10">👁️</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls - Safe for Mobile */}
      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 z-[110] w-full px-6 justify-center">
        <button 
            onClick={() => { stopVoiceSession(); onBack(); }} 
            className="flex-1 max-w-[150px] md:max-w-none px-4 md:px-10 py-3 md:py-4 bg-black/95 backdrop-blur-2xl border border-gold-muted/30 text-gold-muted hover:text-gold-bright transition-all font-mystic text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.5em] rounded-full shadow-2xl"
        >
          Sortir
        </button>
        {step === 'interpreting' && (
            <button 
                onClick={() => {
                    setStep('drawing');
                    setSelectedCards([]);
                    setFlippedIndices(new Set());
                    setTranscript('');
                    startVoiceSession("Le destin est une page blanche. Choisissez trois nouvelles cartes.");
                }}
                className="flex-1 max-w-[200px] md:max-w-none px-4 md:px-12 py-3 md:py-4 bg-gold-bright text-black font-mystic text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.5em] rounded-full shadow-lg hover:scale-105 transition-all"
            >
              Nouveau Tirage
            </button>
        )}
      </div>

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .back-oracle {
          background: linear-gradient(135deg, #000428 0%, #004e92 100%);
          background-image: 
            radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 80%),
            url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23b8860b' fill-opacity='0.2'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default TarotRoom;

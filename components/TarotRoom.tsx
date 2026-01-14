
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

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const welcome = "Bienvenue dans mon sanctuaire. L'Oracle est prêt. Concentrez-vous sur l'énergie qui vous entoure et choisissez trois cartes pour poser les bases de votre destin.";
    startVoiceSession(welcome);
    return () => stopVoiceSession();
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
          systemInstruction: "Tu es Cécile, une cartomancienne experte de l'Oracle. RÉPONDS TOUJOURS EN FRANÇAIS. Ton ton est chaleureux, mystérieux et très intuitif. L'utilisateur tire des cartes de l'Oracle. Quand il en a 3, analyse-les comme un tout cohérent (Passé, Présent, Futur). Ensuite, INVITE-LE explicitement à tirer jusqu'à 3 cartes de précision supplémentaires pour éclairer un point d'ombre. Analyse chaque nouvelle carte dès qu'elle apparaît.",
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
    
    // Play small sound effect simulation
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});

    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);

    if (step === 'interpreting') {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
      startVoiceSession(`Une carte de précision : ${card.name}. Voyons ce qu'elle nous révèle de plus sur cette situation...`);
    } else if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Les trois piliers sont posés. Retournez-les un par un, je vous prie.");
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
      startVoiceSession(`Le voile se lève sur ${names}. Voici ce que les vibrations me disent... Une fois que vous m'aurez écoutée, vous pourrez piocher de nouvelles cartes pour approfondir.`);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-start space-y-10 pb-28 pt-8">
      {/* Voice Status Indicator */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-4 px-8 py-3 bg-black/80 backdrop-blur-2xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-110' : 'border-gold-muted/20 scale-100'}`}>
        <div className="flex gap-1.5 items-end h-5">
           {[...Array(6)].map((_, i) => (
             <div 
               key={i} 
               className={`w-1 bg-gold-bright rounded-full transition-all duration-300 ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`}
               style={{ height: voiceStatus === 'speaking' ? `${40 + Math.random() * 60}%` : '4px', animationDelay: `${i * 0.1}s` }}
             ></div>
           ))}
        </div>
        <span className="font-mystic text-xs text-gold-bright uppercase tracking-[0.3em]">{voiceStatus === 'speaking' ? "Cécile interprète vos signes..." : "L'Oracle est silencieux..."}</span>
      </div>

      {/* Main Spread Area */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-8 px-6 min-h-[400px]">
        {selectedCards.map((card, i) => (
          <div 
              key={i} 
              onClick={() => flipCard(i)} 
              className={`w-36 h-56 md:w-48 md:h-72 cursor-pointer perspective-1000 group transition-all duration-1000 animate-in zoom-in-50 slide-in-from-bottom-20 ${flippedIndices.has(i) ? 'rotate-y-180' : 'hover:-translate-y-4'}`}
          >
            <div className="relative w-full h-full transition-all duration-700 preserve-3d shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border border-gold-muted/20">
              {/* Back of the card */}
              <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center p-4">
                 <div className="w-full h-full border-2 border-gold-bright/10 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,215,0,0.05)_0%,transparent_70%)] animate-pulse"></div>
                    <span className="text-5xl text-gold-bright/30 group-hover:text-gold-bright group-hover:scale-125 transition-all duration-500">👁️</span>
                 </div>
              </div>
              {/* Front of the card */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-4 flex flex-col items-center justify-between border-4 border-gold-muted shadow-2xl">
                 <div className="text-amber-950/20 font-mystic text-[10px] uppercase tracking-widest">Oracle de Cécile</div>
                 <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <span className="text-7xl md:text-9xl filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)] animate-float-subtle">{card.image}</span>
                    <h4 className="text-center font-mystic text-sm md:text-lg text-amber-950 uppercase tracking-[0.2em] border-b border-amber-900/10 pb-2">{card.name}</h4>
                 </div>
                 <p className="text-[10px] text-amber-900/60 font-serif italic text-center px-2">{card.meaning}</p>
              </div>
            </div>
          </div>
        ))}
        {/* Placeholder for remaining draws */}
        {selectedCards.length > 0 && selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
           <div key={i} className="w-36 h-56 md:w-48 md:h-72 rounded-2xl border-2 border-dashed border-gold-muted/20 flex items-center justify-center opacity-30">
              <span className="font-mystic text-xs text-gold-muted uppercase">Pilier {selectedCards.length + i + 1}</span>
           </div>
        ))}
      </div>

      {/* Interpretation Parchment */}
      {step === 'interpreting' && (
        <div className="w-full max-w-4xl px-6 animate-in fade-in duration-1000">
            <div className="parchment p-10 md:p-16 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.6)] antique-border relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold-bright/20 to-transparent"></div>
                <div className="prose prose-stone max-w-none relative z-10">
                    <p className="italic text-2xl md:text-4xl text-amber-950 font-serif leading-relaxed first-letter:text-7xl first-letter:font-mystic first-letter:mr-4 first-letter:float-left first-letter:text-amber-900 drop-shadow-sm">
                       {transcript || "Cécile entre en communion avec l'invisible..."}
                    </p>
                </div>
                {selectedCards.length < 6 && (
                   <div className="mt-12 pt-8 border-t border-amber-950/10 text-center animate-pulse">
                      <p className="font-mystic text-xs text-amber-900/50 uppercase tracking-[0.4em]">Piochez une carte de précision pour dissiper les doutes</p>
                   </div>
                )}
            </div>
        </div>
      )}

      {/* The Deck Spread (Interactable) */}
      {(step === 'drawing' || (step === 'interpreting' && selectedCards.length < 6)) && (
        <div className="w-full flex flex-col items-center space-y-12 pb-10">
          <div className="text-center space-y-2">
             <h3 className="font-mystic text-gold-bright text-sm uppercase tracking-[0.6em]">L'Eventail des Possibles</h3>
             <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-gold-bright/40 to-transparent mx-auto"></div>
          </div>
          
          <div className="relative w-full max-w-5xl h-48 flex justify-center items-end px-10">
            {ORACLE_CARDS.map((card, i) => {
              const isSelected = selectedCards.find(c => c.name === card.name);
              // Calculate fan-out rotation
              const rotation = (i - (ORACLE_CARDS.length / 2)) * 6;
              const translateX = (i - (ORACLE_CARDS.length / 2)) * 25;
              
              return (
                <button 
                  key={i} 
                  onClick={() => drawCard(card)} 
                  disabled={!!isSelected}
                  className={`absolute w-24 h-40 md:w-32 md:h-52 back-oracle rounded-xl shadow-2xl border-2 border-gold-muted/40 transition-all duration-500 hover:-translate-y-12 hover:scale-110 active:scale-95 flex items-center justify-center ${isSelected ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100'}`}
                  style={{ 
                    transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
                    transformOrigin: 'bottom center',
                    zIndex: i
                  }}
                >
                  <span className="text-2xl opacity-10 drop-shadow-md">👁️</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-6 z-50">
        <button 
            onClick={() => { stopVoiceSession(); onBack(); }} 
            className="px-10 py-4 bg-black/90 backdrop-blur-2xl border border-gold-muted/30 text-gold-muted hover:text-gold-bright transition-all font-mystic text-[10px] uppercase tracking-[0.5em] rounded-full shadow-2xl hover:shadow-gold-bright/10"
        >
          Sortir du Salon
        </button>
        {step === 'interpreting' && (
            <button 
                onClick={() => {
                    setStep('drawing');
                    setSelectedCards([]);
                    setFlippedIndices(new Set());
                    setTranscript('');
                    startVoiceSession("Le destin est une page blanche que nous réécrivons ensemble. Choisissez trois nouvelles cartes.");
                }}
                className="px-12 py-4 bg-gold-bright text-black font-mystic text-[10px] uppercase tracking-[0.5em] rounded-full shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:scale-105 active:scale-95 transition-all"
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

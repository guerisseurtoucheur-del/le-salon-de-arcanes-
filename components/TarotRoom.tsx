
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
  { name: "La Rencontre", image: "🤝", meaning: "Une personné clé va croiser votre route." },
  { name: "Le Secret", image: "🤫", meaning: "Une vérité cachée va éclater." },
];

const CardBackContent = () => (
  <div className="w-full h-full relative overflow-hidden">
    <div className="card-inner-frame"></div>
    <div className="mystic-seal">
      <div className="seal-ring"></div>
      <span className="seal-decor-top">✧</span>
      <span className="seal-decor-bottom">✧</span>
      <span className="seal-decor-left">☾</span>
      <span className="seal-decor-right">☽</span>
      <span className="seal-main-icon">👁️</span>
    </div>
  </div>
);

const TarotRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState<'drawing' | 'flipping' | 'interpreting' | 'questioning'>('drawing');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [question, setQuestion] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    startVoiceSession("Bonjour. Je suis Cécile. Installez-vous confortablement. Choisissez trois cartes dans l'éventail devant vous pour poser les bases de notre séance. Je vous écoute.");
    
    return () => {
      stopVoiceSession();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const resumeAudio = () => {
    if (outputContextRef.current?.state === 'suspended') {
      outputContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const startVoiceSession = async (initialPrompt?: string) => {
    if (sessionRef.current) {
      if (initialPrompt) {
        try {
          sessionRef.current.sendRealtimeInput({ parts: [{ text: initialPrompt }] });
        } catch (e) {
          sessionRef.current = null;
          await startVoiceSession(initialPrompt);
        }
      }
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
              if (!audioContextRef.current || audioContextRef.current.state === 'closed' || !sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionRef.current.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            if (initialPrompt) sessionPromise.then(s => s.sendRealtimeInput({ parts: [{ text: initialPrompt }] }));
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                setTranscript(prev => {
                  if (prev.includes("Cécile se concentre") || prev.includes("Cécile observe")) return text;
                  return prev + text;
                });
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim().length > 5 && step === 'questioning') {
                setQuestion(prev => prev.length < text.length ? text : prev);
              }
            }
            
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data && outputContextRef.current && outputContextRef.current.state !== 'closed') {
                  setVoiceStatus('speaking');
                  resumeAudio();
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                  const buffer = await decodeAudioData(decodeAudio(part.inlineData.data), outputContextRef.current, 24000, 1);
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
              }
            }
          },
          onclose: () => {
            setVoiceStatus('idle');
            sessionRef.current = null;
          },
          onerror: () => {
            setVoiceStatus('idle');
            sessionRef.current = null;
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une cartomancienne experte et charismatique. Ton ton est chaleureux, mystérieux et très INTERACTIF. RÉPONDS TOUJOURS EN FRANÇAIS. Commente chaque carte quand elle est révélée. Quand l'utilisateur pose une question, utilise ta voix pour donner une interprétation profonde en liant toutes les cartes ensemble. Ton but est de rendre l'expérience vivante.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      setVoiceStatus('idle');
      sessionRef.current = null;
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputContextRef.current) outputContextRef.current.close().catch(() => {});
  };

  const drawCard = (card: TarotCard) => {
    resumeAudio();
    if (selectedCards.length >= 6 || selectedCards.find(c => c.name === card.name)) return;
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});

    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);

    if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Les trois piliers de votre destin sont posés. Retournez-les un par un, je vous dirai ce que j'y vois...");
    } else if (newSelection.length > 3) {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
      startVoiceSession(`Vous avez choisi ${card.name} comme précision. Un choix intéressant...`);
    }
  };

  const flipCard = (index: number) => {
    resumeAudio();
    if (step !== 'flipping' || flippedIndices.has(index)) return;
    const newFlipped = new Set(flippedIndices);
    newFlipped.add(index);
    setFlippedIndices(newFlipped);
    
    const card = selectedCards[index];
    const position = index === 0 ? "le Passé" : index === 1 ? "le Présent" : "le Futur";
    
    if (newFlipped.size < 3) {
      startVoiceSession(`Pour ${position}, l'arcane de ${card.name} se révèle. ${card.meaning}`);
    } else {
      setStep('interpreting');
      setTranscript("Cécile se concentre sur les fils de votre existence...");
      const names = selectedCards.slice(0, 3).map(c => c.name).join(', ');
      startVoiceSession(`Le triptyque est complet : ${names}. Laissez-moi vous dire ce que cela signifie pour votre chemin global... Après cela, vous pourrez me poser une question précise.`);
      setTimeout(() => setStep('questioning'), 10000);
    }
  };

  const askFinalQuestion = (e?: React.FormEvent) => {
    e?.preventDefault();
    resumeAudio();
    if (!question.trim()) return;
    
    setTranscript("Cécile écoute votre tourment...");
    const names = selectedCards.map(c => c.name).join(', ');
    startVoiceSession(`L'utilisateur me demande : "${question}". En regardant ses cartes (${names}), voici ma réponse finale et mes conseils...`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pb-48 pt-10 overflow-x-hidden relative" onClick={resumeAudio}>
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.1)_0%,transparent_70%)]"></div>

      {/* Header Area (Respect de la hiérarchie demandée) */}
      <div className="flex flex-col items-center z-[60] mb-8 space-y-4">
        
        {/* 1. Cécile vous écoute (Tout en haut) */}
        <div className={`flex items-center gap-4 px-8 py-3 bg-black/95 backdrop-blur-3xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.5)] scale-105' : 'border-gold-muted/20 scale-100'}`}>
          <div className="flex gap-1 items-end h-5">
             {[...Array(6)].map((_, i) => (
               <div key={i} className={`w-1 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`} style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px' }}></div>
             ))}
          </div>
          <span className="font-mystic text-[10px] md:text-xs text-gold-bright uppercase tracking-widest">
            {voiceStatus === 'speaking' ? "Cécile vous parle..." : voiceStatus === 'listening' ? "Cécile vous écoute" : "L'Oracle attend"}
          </span>
        </div>

        {/* 2. Bulle Tirage / Progression */}
        <div className="flex items-center gap-4 bg-black/60 px-6 py-2 rounded-full border border-gold-muted/20 shadow-2xl">
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${selectedCards.length >= 3 ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
          <div className="w-8 h-[1px] bg-gold-muted/30"></div>
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step === 'questioning' && question.trim() ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
          <div className="w-8 h-[1px] bg-gold-muted/30"></div>
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${transcript.length > 50 ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
          <span className="font-mystic text-[10px] text-gold-muted uppercase tracking-widest ml-4">
            {selectedCards.length < 3 ? "1. Tirage" : !question ? "2. Question" : "3. Révélation"}
          </span>
        </div>
        
        {/* 3. Phrase percutante (Dessous) */}
        {(selectedCards.length < 3) && (
          <h3 className="font-mystic text-gold-bright text-xs md:text-lg uppercase tracking-[0.4em] animate-in fade-in slide-in-from-top-2 duration-1000 pt-2">
             Éveillez les 3 Arcanes de votre Destin
          </h3>
        )}
        {(selectedCards.length >= 3 && selectedCards.length < 6 && step === 'questioning') && (
           <h3 className="font-mystic text-gold-bright text-xs md:text-lg uppercase tracking-[0.4em] animate-in fade-in slide-in-from-top-2 duration-1000 pt-2 text-center">
             Posez votre question à Cécile...
          </h3>
        )}
      </div>

      {/* Main Table Content */}
      <div className="w-full max-w-6xl z-10 flex flex-col items-center gap-4 px-4">
        
        {/* Spread Area (Slots de cartes) */}
        <div className="w-full flex flex-wrap justify-center gap-4 md:gap-12 min-h-[300px] md:min-h-[400px] items-center z-[50]">
          {selectedCards.map((card, i) => (
            <div 
                key={i} 
                onClick={() => i < 3 && flipCard(i)} 
                className={`w-28 h-44 md:w-56 md:h-80 cursor-pointer perspective-1000 group transition-all duration-1000 ${flippedIndices.has(i) ? '' : 'hover:-translate-y-4 hover:shadow-[0_20px_50px_rgba(255,215,0,0.2)]'}`}
            >
              <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-xl md:rounded-2xl ${flippedIndices.has(i) ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center rounded-xl md:rounded-2xl z-[2]">
                   <CardBackContent />
                </div>
                <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-4 md:p-8 flex flex-col items-center justify-between border-4 border-gold-muted rounded-xl md:rounded-2xl shadow-inner z-[1]">
                   <div className="text-amber-950/40 font-mystic text-[10px] md:text-sm uppercase tracking-tighter border-b border-amber-900/10 w-full text-center pb-2">
                      {i === 0 ? "Le Passé" : i === 1 ? "Le Présent" : i === 2 ? "Le Futur" : "Précision"}
                   </div>
                   <div className="flex-1 flex flex-col items-center justify-center gap-4">
                      <span className="text-5xl md:text-8xl filter drop-shadow-lg">{card.image}</span>
                      <h4 className="text-center font-mystic text-sm md:text-2xl text-amber-950 uppercase tracking-widest leading-tight">{card.name}</h4>
                   </div>
                   <div className="w-full text-center border-t border-amber-900/10 pt-4">
                      <p className="text-[9px] md:text-sm text-amber-900/70 font-serif italic leading-tight">{card.meaning}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
             <div key={i} className="w-28 h-44 md:w-56 md:h-80 rounded-xl md:rounded-2xl border-2 border-dashed border-gold-muted/10 flex items-center justify-center opacity-20">
                <span className="font-mystic text-xs text-gold-muted uppercase">Arcane {selectedCards.length + i + 1}</span>
             </div>
          ))}
        </div>

        {/* Deck Éventail (Placé juste sous les slots) */}
        {(step === 'drawing' || (step === 'questioning' && selectedCards.length < 6)) && (
          <div className="w-full flex flex-col items-center py-4 z-[55] animate-in fade-in zoom-in duration-700">
            <div className="relative w-full max-w-5xl h-48 md:h-60 flex justify-center items-end px-10 overflow-x-auto no-scrollbar overflow-y-visible">
              <div className="flex relative w-fit mx-auto min-w-full justify-center">
                {ORACLE_CARDS.map((card, i) => {
                  const isSelected = selectedCards.find(c => c.name === card.name);
                  const factor = isMobile ? 4 : 6;
                  const spacing = isMobile ? 12 : 30;
                  const rotation = (i - (ORACLE_CARDS.length / 2)) * factor;
                  const translateX = (i - (ORACLE_CARDS.length / 2)) * spacing;
                  return (
                    <button 
                      key={i} 
                      onClick={() => drawCard(card)} 
                      disabled={!!isSelected}
                      className={`absolute w-20 h-32 md:w-40 md:h-60 back-oracle rounded-xl shadow-2xl border border-gold-muted/30 transition-all duration-500 hover:-translate-y-16 hover:scale-110 active:scale-95 flex items-center justify-center ${isSelected ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 group'}`}
                      style={{ transform: `translateX(${translateX}px) rotate(${rotation}deg)`, transformOrigin: 'bottom center', zIndex: i }}
                    >
                      <CardBackContent />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Overlay */}
        {step === 'flipping' && (
          <div className="animate-bounce z-[40] bg-black/60 px-10 py-4 rounded-full backdrop-blur-md border border-gold-bright/20 shadow-xl my-4">
            <p className="font-mystic text-gold-bright text-lg md:text-2xl tracking-[0.3em] uppercase">
               ✨ Retournez vos cartes ✨
            </p>
          </div>
        )}

        {/* Parchment Revelation (Le Parchemin Déroulant) */}
        {transcript && (
          <div className="w-full max-w-4xl animate-in fade-in slide-in-from-top-4 duration-1000 mb-20 z-[20]">
              <div className="parchment-unroll p-10 md:p-20 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] antique-border bg-[#fdf6e3] relative overflow-hidden">
                  <div className="absolute top-6 right-10 font-mystic text-[10px] text-amber-900/30 uppercase tracking-[0.5em]">Verbum Oraculi</div>
                  <div className="prose prose-stone max-w-none">
                      <p className="transcript-reveal italic text-2xl md:text-4xl text-amber-950 font-serif leading-relaxed first-letter:text-6xl md:first-letter:text-8xl first-letter:font-mystic first-letter:mr-6 first-letter:float-left first-letter:text-amber-900 first-letter:leading-none">
                         {transcript}
                      </p>
                      <div ref={transcriptRef} className="h-4 w-full" />
                  </div>
              </div>
          </div>
        )}

        {/* Question Area */}
        {step === 'questioning' && (
          <div className="w-full max-w-2xl animate-in slide-in-from-bottom-10 duration-700 space-y-6 z-[30] my-8">
            <div className="text-center space-y-2">
              <h4 className="font-mystic text-gold-bright text-xl uppercase tracking-widest">Parlez à Cécile</h4>
              <p className="text-gold-muted/60 text-sm italic font-serif">Le voile est levé. Quelle vérité cherchez-vous maintenant ?</p>
            </div>
            <div className="relative group shadow-3xl">
              <textarea 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Que me réserve mon prochain voyage ?"
                className="w-full bg-black/95 border-2 border-gold-bright/30 p-8 rounded-[2.5rem] text-gold-bright text-2xl font-serif italic focus:border-gold-bright transition-all min-h-[160px] resize-none pr-16 shadow-inner"
              />
              <div className="absolute right-6 bottom-6 flex gap-4">
                <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${voiceStatus === 'listening' ? 'bg-gold-bright text-black border-gold-bright scale-110 shadow-[0_0_30px_gold]' : 'bg-black border-gold-bright/30 text-gold-bright'}`}>
                  🎙️
                </div>
              </div>
            </div>
            <button 
              onClick={askFinalQuestion}
              disabled={!question.trim() || voiceStatus === 'connecting'}
              className="w-full py-8 bg-gradient-to-r from-gold-muted via-gold-bright to-gold-muted text-black font-mystic text-2xl tracking-[0.3em] uppercase rounded-3xl shadow-[0_0_50px_rgba(255,215,0,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-6 group"
            >
              <span className="group-hover:rotate-12 transition-transform">✨</span> 
              {voiceStatus === 'connecting' ? 'Invocation...' : "Écouter l'Oracle"} 
              <span className="group-hover:-rotate-12 transition-transform">✨</span>
            </button>
          </div>
        )}
      </div>

      {/* Persistent Navigation Footer */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-8 z-[110] w-full px-10 justify-center">
        <button onClick={() => { stopVoiceSession(); onBack(); }} className="px-10 py-5 bg-black/90 border border-gold-muted/30 text-gold-muted font-mystic text-xs uppercase tracking-[0.4em] rounded-full hover:border-gold-bright transition-all shadow-xl">Quitter le Salon</button>
        {(step === 'interpreting' || step === 'questioning') && (
            <button 
                onClick={() => { setStep('drawing'); setSelectedCards([]); setFlippedIndices(new Set()); setTranscript(''); setQuestion(''); startVoiceSession("Le destin se renouvelle. Levez à nouveau le voile sur votre avenir..."); }}
                className="px-10 py-5 bg-gold-bright text-black font-mystic text-xs uppercase tracking-[0.4em] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >Nouveau Tirage</button>
        )}
      </div>

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        .parchment-unroll {
          animation: unroll-parchment 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          transform-origin: top;
          max-height: 0;
          opacity: 0;
        }
        
        @keyframes unroll-parchment {
          0% { max-height: 0; opacity: 0; transform: scaleY(0.9); }
          100% { max-height: 2000px; opacity: 1; transform: scaleY(1); }
        }

        .transcript-reveal {
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          animation: text-reveal-scroll 2s ease-out forwards;
        }

        @keyframes text-reveal-scroll {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TarotRoom;

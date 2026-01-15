
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
          systemInstruction: "Tu es Cécile, une cartomancienne experte et charismatique. RÉPONDS TOUJOURS EN FRANÇAIS. Ton ton est chaleureux, mystérieux et très INTERACTIF. Ne te contente pas de lire, dialogue avec l'utilisateur. Commente chaque carte quand elle est révélée (Passé, Présent, Futur). Quand l'utilisateur pose une question, utilise ta voix pour donner une interprétation profonde en liant toutes les cartes ensemble. Sois rassurante mais honnête. Tu es une présence vivante dans ce salon.",
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
      setTranscript("Cécile analyse l'ensemble de vos arcanes...");
      const names = selectedCards.slice(0, 3).map(c => c.name).join(', ');
      startVoiceSession(`Le triptyque est complet : ${names}. Laissez-moi vous dire ce que cela signifie pour votre chemin global... Après cela, vous pourrez me poser une question précise.`);
      setTimeout(() => setStep('questioning'), 8000);
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
    <div className="min-h-[85vh] flex flex-col items-center justify-start space-y-6 md:space-y-10 pb-32 pt-4 md:pt-8 overflow-x-hidden" onClick={resumeAudio}>
      
      {/* Progression Indicator */}
      <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-gold-muted/20 z-50 shadow-lg">
        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${selectedCards.length >= 3 ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
        <div className="w-8 h-[1px] bg-gold-muted/30"></div>
        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${step === 'questioning' && question.trim() ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
        <div className="w-8 h-[1px] bg-gold-muted/30"></div>
        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${transcript.length > 50 ? 'bg-gold-bright shadow-[0_0_15px_gold]' : 'bg-white/10'}`}></div>
        <span className="font-mystic text-[10px] text-gold-muted uppercase tracking-widest ml-4">
          {selectedCards.length < 3 ? "1. Tirage" : !question ? "2. Question" : "3. Révélation"}
        </span>
      </div>

      {/* Voice Status Indicator */}
      <div className={`fixed top-16 md:top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 md:gap-4 px-6 md:px-8 py-2 md:py-3 bg-black/95 backdrop-blur-3xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.5)] scale-105' : 'border-gold-muted/20 scale-100'}`}>
        <div className="flex gap-1 items-end h-4 md:h-5">
           {[...Array(6)].map((_, i) => (
             <div key={i} className={`w-0.5 md:w-1 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`} style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px' }}></div>
           ))}
        </div>
        <span className="font-mystic text-[9px] md:text-xs text-gold-bright uppercase tracking-widest">
          {voiceStatus === 'speaking' ? "Cécile vous parle..." : voiceStatus === 'listening' ? "Cécile vous écoute" : "L'Oracle attend"}
        </span>
      </div>

      {/* Instructional Overlay */}
      {step === 'flipping' && (
        <div className="text-center animate-bounce z-50 bg-black/60 px-8 py-3 rounded-full backdrop-blur-md border border-gold-bright/20 shadow-xl">
          <p className="font-mystic text-gold-bright text-sm md:text-xl tracking-widest uppercase">
             ✨ Retournez vos cartes ✨
          </p>
        </div>
      )}

      {/* Main Spread Area */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-4 md:gap-10 px-4 min-h-[300px] md:min-h-[400px]">
        {selectedCards.map((card, i) => (
          <div 
              key={i} 
              onClick={() => i < 3 && flipCard(i)} 
              className={`w-28 h-44 md:w-52 md:h-80 cursor-pointer perspective-1000 group transition-all duration-1000 ${flippedIndices.has(i) ? '' : 'hover:-translate-y-4'}`}
          >
            <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-xl md:rounded-2xl ${flippedIndices.has(i) ? 'rotate-y-180' : ''}`}>
              
              <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center rounded-xl md:rounded-2xl">
                 <CardBackContent />
              </div>

              <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-3 md:p-6 flex flex-col items-center justify-between border-2 md:border-4 border-gold-muted rounded-xl md:rounded-2xl shadow-inner">
                 <div className="text-amber-950/40 font-mystic text-[8px] md:text-[11px] uppercase tracking-tighter border-b border-amber-900/10 w-full text-center pb-1">
                    {i === 0 ? "Le Passé" : i === 1 ? "Le Présent" : i === 2 ? "Le Futur" : "Précision"}
                 </div>
                 <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl md:text-8xl filter drop-shadow-lg">{card.image}</span>
                    <h4 className="text-center font-mystic text-[10px] md:text-xl text-amber-950 uppercase tracking-widest leading-tight">{card.name}</h4>
                 </div>
                 <div className="w-full text-center border-t border-amber-900/10 pt-2">
                    <p className="text-[7px] md:text-[12px] text-amber-900/70 font-serif italic leading-tight">{card.meaning}</p>
                 </div>
              </div>

            </div>
          </div>
        ))}
        {selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
           <div key={i} className="w-28 h-44 md:w-52 md:h-80 rounded-xl md:rounded-2xl border-2 border-dashed border-gold-muted/10 flex items-center justify-center opacity-20">
              <span className="font-mystic text-[8px] md:text-xs text-gold-muted uppercase">Arcane {selectedCards.length + i + 1}</span>
           </div>
        ))}
      </div>

      {/* Questioning Phase UI */}
      {step === 'questioning' && (
        <div className="w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 duration-700 space-y-6 z-50">
          <div className="text-center space-y-2">
            <h4 className="font-mystic text-gold-bright text-lg uppercase tracking-widest">Parlez à Cécile</h4>
            <p className="text-gold-muted/60 text-xs italic font-serif">Posez votre question à voix haute ou écrivez-la.</p>
          </div>
          
          <div className="relative group shadow-2xl">
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Que me réserve mon prochain voyage ?"
              className="w-full bg-black/95 border-2 border-gold-bright/30 p-8 rounded-[2rem] text-gold-bright text-xl md:text-2xl font-serif italic focus:border-gold-bright transition-all min-h-[160px] resize-none pr-12 shadow-inner"
            />
            <div className="absolute right-4 bottom-4 flex gap-4">
              <div 
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${voiceStatus === 'listening' ? 'bg-gold-bright text-black border-gold-bright scale-110 shadow-[0_0_20px_gold]' : 'bg-black border-gold-bright/30 text-gold-bright'}`}
              >
                🎙️
              </div>
            </div>
          </div>

          <button 
            onClick={askFinalQuestion}
            disabled={!question.trim() || voiceStatus === 'connecting'}
            className="w-full py-6 bg-gradient-to-r from-gold-muted via-gold-bright to-gold-muted text-black font-mystic text-xl tracking-[0.2em] uppercase rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-4 group"
          >
            <span className="group-hover:rotate-12 transition-transform">✨</span> 
            {voiceStatus === 'connecting' ? 'Invocation...' : "Écouter l'Interprétation"} 
            <span className="group-hover:-rotate-12 transition-transform">✨</span>
          </button>
        </div>
      )}

      {/* Parchment Interpretation */}
      {(transcript) && (
        <div className="w-full max-w-4xl px-4 animate-in fade-in duration-1000 mb-12">
            <div className="parchment p-8 md:p-16 rounded-[2rem] shadow-2xl antique-border bg-[#fdf6e3] relative overflow-hidden">
                <div className="absolute top-4 right-8 font-mystic text-[10px] text-amber-900/20 uppercase tracking-widest">Le Verbe de Cécile</div>
                <div className="prose prose-stone max-w-none">
                    <p className="italic text-xl md:text-3xl text-amber-950 font-serif leading-relaxed first-letter:text-5xl md:first-letter:text-7xl first-letter:font-mystic first-letter:mr-4 first-letter:float-left first-letter:text-amber-900">
                       {transcript}
                    </p>
                    <div ref={transcriptRef} />
                </div>
            </div>
        </div>
      )}

      {/* The Deck Spread */}
      {(step === 'drawing' || (step === 'questioning' && selectedCards.length < 6)) && (
        <div className="w-full flex flex-col items-center space-y-4 md:space-y-12 pb-10">
          <h3 className="font-mystic text-gold-bright text-[10px] md:text-sm uppercase tracking-[0.6em]">
             {selectedCards.length < 3 ? "Choisissez vos 3 Arcanes Piliers" : "Demander une Précision"}
          </h3>
          <div className="relative w-full max-w-5xl h-40 md:h-52 flex justify-center items-end px-4 md:px-10 overflow-x-auto no-scrollbar">
            <div className="flex relative w-fit mx-auto min-w-full justify-center">
              {ORACLE_CARDS.map((card, i) => {
                const isSelected = selectedCards.find(c => c.name === card.name);
                const factor = isMobile ? 4 : 6;
                const spacing = isMobile ? 12 : 25;
                const rotation = (i - (ORACLE_CARDS.length / 2)) * factor;
                const translateX = (i - (ORACLE_CARDS.length / 2)) * spacing;
                return (
                  <button 
                    key={i} 
                    onClick={() => drawCard(card)} 
                    disabled={!!isSelected}
                    className={`absolute w-16 h-28 md:w-36 md:h-56 back-oracle rounded-lg shadow-xl border border-gold-muted/30 transition-all duration-500 hover:-translate-y-10 hover:scale-110 active:scale-95 flex items-center justify-center ${isSelected ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 group'}`}
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

      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 z-[110] w-full px-6 justify-center">
        <button onClick={() => { stopVoiceSession(); onBack(); }} className="px-6 md:px-12 py-4 bg-black/90 border border-gold-muted/30 text-gold-muted font-mystic text-[10px] uppercase tracking-widest rounded-full hover:border-gold-bright transition-all">Quitter</button>
        {(step === 'interpreting' || step === 'questioning') && (
            <button 
                onClick={() => { setStep('drawing'); setSelectedCards([]); setFlippedIndices(new Set()); setTranscript(''); setQuestion(''); startVoiceSession("Le destin se renouvelle. Levez à nouveau le voile sur votre avenir..."); }}
                className="px-6 md:px-12 py-4 bg-gold-bright text-black font-mystic text-[10px] uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
            >Nouveau Tirage</button>
        )}
      </div>
    </div>
  );
};

export default TarotRoom;

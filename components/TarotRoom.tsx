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
  { name: "La Fidélité", image: "🐕", meaning: "Un soutien indéfectical de votre entourage." },
  { name: "L'Union", image: "💍", meaning: "Un engagement fort, amoureux ou professionnel." },
  { name: "Le Voyage", image: "🚢", meaning: "Un déplacement nécessaire pour votre évolution." },
  { name: "La Maison", image: "🏠", meaning: "La stabilité retrouvée, le foyer protecteur." },
  { name: "L'Argent", image: "💰", meaning: "Une amélioration matérielle substantielle." },
  { name: "Le Malheur", image: "🥀", meaning: "Une fin de cycle, nécessaire pour renaître." },
  { name: "L'Espoir", image: "🌟", meaning: "La lumière au bout du tunnel." },
  { name: "La Rencontre", image: "🤝", meaning: "Une personnee clé va croiser votre route." },
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
    
    startVoiceSession("Bonjour. Je suis Cécile. Installez-vous. Choisissez trois cartes pour que nous puissions lire les fils de votre existence.");
    
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
                  if (prev.includes("Cécile se concentre")) return text;
                  return prev + text;
                });
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim().length > 5 && (step === 'questioning' || step === 'interpreting')) {
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
          onclose: () => { setVoiceStatus('idle'); sessionRef.current = null; },
          onerror: () => { setVoiceStatus('idle'); sessionRef.current = null; }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une cartomancienne de renom. Ton ton est chaleureux, mystérieux et très professionnel. RÉPONDS TOUJOURS EN FRANÇAIS. Tu analyses les tirages avec une grande précision poétique. Tu vois parfaitement les cartes sur la table, tu n'as pas besoin qu'on te les décrive. Ton rôle est d'interpréter les arcanes et de guider le consultant avec sagesse.",
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
      startVoiceSession("C'est parfait. Maintenant, retournez ces trois arcanes pour que je puisse en lire les secrets.");
    } else if (newSelection.length > 3) {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
      
      // Rappel immédiat du contexte complet lors d'une précision
      const context = newSelection.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : i === 2 ? 'Futur' : 'Précision'} : ${c.name}`).join(", ");
      startVoiceSession(`L'arcane de ${card.name} s'ajoute à votre chemin. Rappel de la vision complète : ${context}. Interprète l'ajout.`);
    }
  };

  const drawFromStack = () => {
    if (selectedCards.length >= 6) return;
    const remaining = ORACLE_CARDS.filter(c => !selectedCards.find(sc => sc.name === c.name));
    if (remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      drawCard(remaining[randomIndex]);
    }
  };

  const flipCard = (index: number) => {
    resumeAudio();
    if (step !== 'flipping' || flippedIndices.has(index)) return;
    const newFlipped = new Set(flippedIndices);
    newFlipped.add(index);
    setFlippedIndices(newFlipped);
    
    if (newFlipped.size === 3) {
      performFullAnalysis();
    }
  };

  const flipAll = () => {
    resumeAudio();
    if (step !== 'flipping') return;
    const allIndices = new Set([0, 1, 2]);
    setFlippedIndices(allIndices);
    performFullAnalysis();
  };

  const performFullAnalysis = () => {
    setStep('interpreting');
    setTranscript("Cécile se concentre sur les fils de votre destin...");
    const interpretationPrompt = `Analyse ce triptyque avec ton expertise de cartomancienne :
    - Passé : ${selectedCards[0].name}
    - Présent : ${selectedCards[1].name}
    - Futur : ${selectedCards[2].name}
    Donne une interprétation fluide et solennelle d'environ 30 à 45 secondes. Termine impérativement ton intervention en demandant au consultant s'il souhaite approfondir cette vision en tirant une, deux ou trois cartes supplémentaires de précision au talon.`;
    
    startVoiceSession(interpretationPrompt);
    setTimeout(() => setStep('questioning'), 5000);
  };

  const askFinalQuestion = (e?: React.FormEvent) => {
    e?.preventDefault();
    resumeAudio();
    if (!question.trim()) return;
    
    const userQuery = question;
    setQuestion(''); // On vide immédiatement pour le ressenti de fluidité
    
    // Feedback immédiat dans le transcript pour l'utilisateur
    setTranscript(prev => prev + "\n\n(Vous) : " + userQuery + "\n\nCécile vous répond...");

    // On inclut tout le contexte des cartes dans le prompt pour que Cécile ne se trompe pas
    const cardsContext = selectedCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : i === 2 ? 'Futur' : 'Précision'} : ${c.name}`).join(", ");
    const fullPrompt = `RAPPEL DU TIRAGE : ${cardsContext}. 
    QUESTION DU CONSULTANT : "${userQuery}". 
    Réponds maintenant en tant que Cécile, en utilisant les symboles des cartes pour guider tes paroles.`;

    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({ parts: [{ text: fullPrompt }] });
    } else {
      startVoiceSession(fullPrompt);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pb-48 pt-6 overflow-x-hidden relative bg-velvet-deep" onClick={resumeAudio}>
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(107,33,168,0.2)_0%,transparent_70%)]"></div>

      {/* Header Area */}
      <div className="flex flex-col items-center z-[60] mb-8 space-y-4 w-full">
        <div className={`flex items-center gap-4 px-6 py-2 bg-black/80 backdrop-blur-3xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.5)] scale-105' : 'border-gold-muted/20 scale-100'}`}>
          <div className="flex gap-1 items-end h-4">
             {[...Array(6)].map((_, i) => (
               <div key={i} className={`w-0.5 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`} style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px' }}></div>
             ))}
          </div>
          <span className="font-mystic text-[9px] md:text-xs text-gold-bright uppercase tracking-widest">
            {voiceStatus === 'speaking' ? "Cécile vous parle..." : voiceStatus === 'listening' ? "Cécile vous écoute" : "L'Oracle attend"}
          </span>
        </div>
      </div>

      {/* Main Spread Area */}
      <div className="w-full max-w-6xl z-10 flex flex-col items-center gap-0 px-4 overflow-visible">
        
        {/* Emplacements des cartes */}
        <div className="w-full flex flex-wrap justify-center gap-3 md:gap-8 min-h-[160px] md:min-h-[260px] items-center z-[50]">
          {selectedCards.map((card, i) => (
            <div 
                key={i} 
                onClick={() => i < 3 && flipCard(i)} 
                className={`w-24 h-36 md:w-52 md:h-72 cursor-pointer perspective-1000 group transition-all duration-1000 ${flippedIndices.has(i) ? '' : 'hover:-translate-y-4 shadow-lg'}`}
            >
              <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-xl ${flippedIndices.has(i) ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center rounded-xl z-[2]">
                   <CardBackContent />
                </div>
                <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-3 md:p-6 flex flex-col items-center justify-between border-2 border-gold-muted rounded-xl shadow-inner z-[1]">
                   <div className="text-amber-950/40 font-mystic text-[8px] md:text-xs uppercase tracking-tighter border-b border-amber-900/10 w-full text-center pb-1">
                      {i === 0 ? "Le Passé" : i === 1 ? "Le Présent" : i === 2 ? "Le Futur" : "Précision"}
                   </div>
                   <div className="flex-1 flex flex-col items-center justify-center gap-2 md:gap-4">
                      <span className="text-3xl md:text-7xl filter drop-shadow-lg">{card.image}</span>
                      <h4 className="text-center font-mystic text-[10px] md:text-xl text-amber-950 uppercase tracking-widest leading-tight">{card.name}</h4>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
             <div key={i} className="w-24 h-36 md:w-52 md:h-72 rounded-xl border-2 border-dashed border-gold-muted/10 flex items-center justify-center opacity-30">
                <span className="font-mystic text-[8px] text-gold-muted uppercase tracking-widest">Arcane {selectedCards.length + i + 1}</span>
             </div>
          ))}
        </div>

        {/* --- BANDEAU INDICATIF --- */}
        {selectedCards.length < 3 && (
          <div className="z-[60] -mt-2 md:-mt-4 mb-8 animate-in fade-in slide-in-from-top-2 duration-700 flex flex-col items-center w-full">
            <div className="flex items-center gap-2 md:gap-4 px-3 md:px-6 py-1 md:py-1.5 bg-black/40 border border-gold-bright/30 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.1)]">
               <span className="animate-bounce-horizontal text-gold-bright text-[10px] md:text-base">✨</span>
               <span className="font-mystic text-gold-bright text-[8px] md:text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                  {selectedCards.length === 0 ? "Choisissez 3 arcanes pour commencer" : 
                   selectedCards.length === 1 ? "Encore 2 cartes à tirer" : 
                   "Une dernière carte pour sceller le destin"}
               </span>
               <span className="animate-bounce-horizontal-reverse text-gold-bright text-[10px] md:text-base">✨</span>
            </div>
            <div className="mt-2 animate-bounce">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </div>
          </div>
        )}

        {/* --- DECK DE CARTES --- */}
        {selectedCards.length < 6 && (
          <div className={`w-full flex flex-col items-center z-[55] transition-all duration-700 ${selectedCards.length < 3 ? 'mt-4' : 'mt-8'}`}>
            {selectedCards.length < 3 ? (
              <div className="flex flex-col items-center gap-12 md:gap-24 -mt-16 md:-mt-24">
                <div className="relative w-full max-w-5xl h-32 md:h-48 flex justify-center items-end px-4">
                  <div className="flex relative w-fit mx-auto min-w-full justify-center">
                    {ORACLE_CARDS.slice(0, 8).map((card, i) => (
                      <button 
                        key={i} 
                        onClick={() => drawCard(card)} 
                        disabled={selectedCards.some(sc => sc.name === card.name)}
                        className={`absolute w-16 h-24 md:w-36 md:h-52 back-oracle rounded-lg shadow-xl border border-gold-muted/30 transition-all duration-300 hover:-translate-y-32 hover:scale-110 active:scale-95 flex items-center justify-center ${selectedCards.some(sc => sc.name === card.name) ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100'}`}
                        style={{ transform: `translateX(${(i - 4) * (isMobile ? 24 : 60)}px) rotate(${(i - 4) * (isMobile ? 4 : 8)}deg)`, transformOrigin: 'bottom center', zIndex: i }}
                      ><CardBackContent /></button>
                    ))}
                  </div>
                </div>
                <div className="relative w-full max-w-5xl h-32 md:h-48 flex justify-center items-end px-4">
                  <div className="flex relative w-fit mx-auto min-w-full justify-center">
                    {ORACLE_CARDS.slice(8).map((card, i) => (
                      <button 
                        key={i+8} 
                        onClick={() => drawCard(card)} 
                        disabled={selectedCards.some(sc => sc.name === card.name)}
                        className={`absolute w-16 h-24 md:w-36 md:h-52 back-oracle rounded-lg shadow-xl border border-gold-muted/30 transition-all duration-300 hover:-translate-y-32 hover:scale-110 active:scale-95 flex items-center justify-center ${selectedCards.some(sc => sc.name === card.name) ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100'}`}
                        style={{ transform: `translateX(${(i - 3.5) * (isMobile ? 24 : 60)}px) rotate(${(i - 3.5) * (isMobile ? 4 : 8)}deg)`, transformOrigin: 'bottom center', zIndex: i }}
                      ><CardBackContent /></button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 mt-4">
                <p className="font-mystic text-gold-muted text-[8px] md:text-xs uppercase tracking-widest opacity-60">Envie d'approfondir la vision ? Piochez au talon (max 3).</p>
                <button 
                  onClick={drawFromStack}
                  className="relative w-20 h-28 md:w-36 md:h-52 back-oracle rounded-lg shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-gold-muted/40 hover:-translate-y-2 transition-transform cursor-pointer group"
                >
                  <div className="absolute -bottom-1 -right-1 w-full h-full bg-black/40 rounded-lg -z-10"></div>
                  <div className="absolute -bottom-2 -right-2 w-full h-full bg-black/20 rounded-lg -z-20"></div>
                  <CardBackContent />
                  <div className="absolute inset-0 bg-gold-bright/0 group-hover:bg-gold-bright/5 transition-colors rounded-lg"></div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Zone de dialogue et actions */}
        <div className="w-full flex flex-col items-center gap-6 mt-4 z-[70]">
          {step === 'flipping' && (
            <button onClick={flipAll} className="animate-bounce bg-black/80 px-8 py-3 rounded-full border border-gold-bright shadow-2xl hover:scale-105 transition-all">
              <span className="font-mystic text-gold-bright text-xs md:text-xl tracking-widest uppercase">✨ Dévoiler les Arcanes ✨</span>
            </button>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="parchment-unroll p-4 md:p-6 rounded-[2rem] shadow-2xl antique-border bg-[#fdf6e3] relative overflow-hidden">
                    <div className="max-h-[140px] md:max-h-[220px] overflow-y-auto no-scrollbar">
                      <p className="italic text-xs md:text-lg text-amber-950 font-serif leading-relaxed text-center whitespace-pre-wrap">
                         <span className="text-amber-900 font-mystic text-xl mr-2">✧</span>{transcript}
                      </p>
                    </div>
                    <div ref={transcriptRef} />
                </div>
            </div>
          )}

          {/* Zone de Question */}
          {(step === 'questioning' || (step === 'interpreting' && transcript)) && (
            <div className="w-full max-w-lg space-y-4 px-4 animate-in fade-in duration-700">
              <div className="relative group shadow-2xl">
                <textarea 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Posez votre question à Cécile sur ce tirage..."
                  className="w-full bg-black/95 border border-gold-bright/30 p-4 rounded-3xl text-gold-bright text-sm md:text-xl font-serif italic focus:border-gold-bright transition-all min-h-[100px] resize-none pr-32 shadow-inner"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askFinalQuestion()}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-3">
                  <button 
                    onClick={askFinalQuestion}
                    disabled={!question.trim()}
                    className="h-10 px-4 bg-gold-bright text-black font-mystic text-[10px] tracking-widest uppercase rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center gap-2"
                  >
                    Envoyer <span className="text-sm">🖋️</span>
                  </button>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${voiceStatus === 'listening' ? 'bg-gold-bright text-black shadow-[0_0_15px_gold]' : 'bg-black text-gold-bright border-gold-bright/30'}`}>
                    <span className="text-xs">🎙️</span>
                  </div>
                </div>
              </div>
              <button onClick={askFinalQuestion} className="w-full py-4 bg-gradient-to-r from-gold-muted via-gold-bright to-gold-muted text-black font-mystic text-[10px] md:text-xs tracking-[0.2em] uppercase rounded-xl shadow-xl hover:scale-[1.02] transition-all">Interroger l'Oracle</button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-[110] w-full px-4 justify-center">
        <button onClick={() => { stopVoiceSession(); onBack(); }} className="px-5 py-2.5 bg-black/90 border border-gold-muted/30 text-gold-muted font-mystic text-[7px] uppercase tracking-[0.3em] rounded-full hover:border-gold-bright transition-all shadow-2xl">Quitter</button>
        {(step === 'interpreting' || step === 'questioning') && (
            <button onClick={() => { setStep('drawing'); setSelectedCards([]); setFlippedIndices(new Set()); setTranscript(''); setQuestion(''); startVoiceSession("Un nouveau cycle. Le destin se remélange..."); }} className="px-5 py-2.5 bg-gold-bright text-black font-mystic text-[7px] uppercase tracking-[0.3em] rounded-full shadow-2xl hover:scale-105 transition-all">Nouveau Tirage</button>
        )}
      </div>

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        .parchment-unroll {
          animation: unroll-parchment 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          transform-origin: top;
          max-height: 0;
          opacity: 0;
        }
        
        @keyframes unroll-parchment {
          0% { max-height: 0; opacity: 0; transform: scaleY(0.8); }
          100% { max-height: 400px; opacity: 1; transform: scaleY(1); }
        }

        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        @keyframes bounce-horizontal-reverse {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }

        .animate-bounce-horizontal {
          animation: bounce-horizontal 1.5s infinite ease-in-out;
        }
        
        .animate-bounce-horizontal-reverse {
          animation: bounce-horizontal-reverse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TarotRoom;
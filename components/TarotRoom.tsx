
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const welcome = "Approchez. Mon Oracle attend que vous posiez les trois premiers piliers de votre futur. Choisissez trois cartes pour commencer.";
    startVoiceSession(welcome);
    
    return () => {
      stopVoiceSession();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const startVoiceSession = async (initialPrompt?: string) => {
    if (outputContextRef.current && outputContextRef.current.state === 'suspended') {
      outputContextRef.current.resume();
    }

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
                const text = message.serverContent.outputTranscription.text;
                setTranscript(prev => (prev.endsWith(text) ? prev : prev + text));
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim().length > 5 && step === 'questioning') {
                setQuestion(text);
              }
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
          systemInstruction: "Tu es Cécile, une cartomancienne experte. RÉPONDS TOUJOURS EN FRANÇAIS. Ton ton est chaleureux et mystérieux. Analyse d'abord les 3 premières cartes comme le Passé, le Présent et le Futur. Puis invite l'utilisateur à poser une question et à tirer jusqu'à 3 cartes de précision. Fais une analyse finale fusionnant tout.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
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

    if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Les trois piliers sont posés. Retournez-les maintenant pour que je puisse les lire.");
    } else if (newSelection.length > 3) {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
    }
  };

  const flipCard = (index: number) => {
    if (step !== 'flipping' || flippedIndices.has(index)) return;
    const newFlipped = new Set(flippedIndices);
    newFlipped.add(index);
    setFlippedIndices(newFlipped);
    
    if (newFlipped.size === 3 && step === 'flipping') {
      setStep('interpreting');
      setTranscript("Cécile observe vos arcanes...");
      const names = selectedCards.slice(0, 3).map(c => c.name).join(', ');
      startVoiceSession(`L'Oracle révèle : ${names}. Voici ma première lecture. Ensuite, posez votre question et demandez des précisions.`);
      setTimeout(() => setStep('questioning'), 6000);
    }
  };

  const askFinalQuestion = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setTranscript("");
    const names = selectedCards.map(c => c.name).join(', ');
    startVoiceSession(`Ma question est : "${question}". Analyse mes ${selectedCards.length} cartes (${names}) pour la réponse finale.`);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-start space-y-6 md:space-y-10 pb-32 pt-4 md:pt-8 overflow-x-hidden">
      
      {/* Progression Indicator */}
      <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-gold-muted/20 z-50">
        <div className={`w-3 h-3 rounded-full ${selectedCards.length >= 3 ? 'bg-gold-bright shadow-[0_0_10px_gold]' : 'bg-white/10'}`}></div>
        <div className="w-8 h-[1px] bg-gold-muted/30"></div>
        <div className={`w-3 h-3 rounded-full ${step === 'questioning' && question.trim() ? 'bg-gold-bright shadow-[0_0_10px_gold]' : 'bg-white/10'}`}></div>
        <div className="w-8 h-[1px] bg-gold-muted/30"></div>
        <div className={`w-3 h-3 rounded-full ${transcript && step === 'questioning' ? 'bg-gold-bright shadow-[0_0_10px_gold]' : 'bg-white/10'}`}></div>
        <span className="font-mystic text-[10px] text-gold-muted uppercase tracking-widest ml-4">
          {selectedCards.length < 3 ? "1. Les Piliers" : !question ? "2. Votre Question" : "3. L'Analyse"}
        </span>
      </div>

      {/* Voice Status Indicator */}
      <div className={`fixed top-16 md:top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 md:gap-4 px-6 md:px-8 py-2 md:py-3 bg-black/90 backdrop-blur-3xl rounded-full border-2 transition-all duration-700 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-105' : 'border-gold-muted/20 scale-100'}`}>
        <div className="flex gap-1 items-end h-4 md:h-5">
           {[...Array(6)].map((_, i) => (
             <div key={i} className={`w-0.5 md:w-1 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`} style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px' }}></div>
           ))}
        </div>
        <span className="font-mystic text-[9px] md:text-xs text-gold-bright uppercase tracking-widest">
          {voiceStatus === 'speaking' ? "Cécile interprète..." : "L'Oracle est prêt"}
        </span>
      </div>

      {/* Instructional Overlay */}
      {step === 'flipping' && (
        <div className="text-center animate-bounce z-50 bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">
          <p className="font-mystic text-gold-bright text-sm md:text-xl tracking-widest uppercase">
             ✨ Cliquez sur les cartes pour les révéler ✨
          </p>
        </div>
      )}

      {/* Main Spread Area */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-4 md:gap-8 px-4 min-h-[300px] md:min-h-[400px]">
        {selectedCards.map((card, i) => (
          <div 
              key={i} 
              onClick={() => i < 3 && flipCard(i)} 
              className={`w-28 h-44 md:w-48 md:h-72 cursor-pointer perspective-1000 group transition-all duration-1000 ${flippedIndices.has(i) ? '' : 'hover:-translate-y-4'}`}
          >
            <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-xl md:rounded-2xl ${flippedIndices.has(i) ? 'rotate-y-180' : ''}`}>
              
              <div className="absolute inset-0 back-oracle backface-hidden flex items-center justify-center p-2 rounded-xl md:rounded-2xl border-2 border-gold-muted/30">
                 <div className="w-full h-full border border-gold-bright/10 rounded-lg flex flex-col items-center justify-center gap-4 relative overflow-hidden bg-gradient-to-br from-indigo-950 to-black">
                    <span className={`text-3xl md:text-6xl text-gold-bright transition-all ${!flippedIndices.has(i) && step === 'flipping' ? 'scale-125 animate-pulse' : 'opacity-40'}`}>👁️</span>
                 </div>
              </div>

              <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#fdf6e3] to-[#e6dbb9] p-3 md:p-6 flex flex-col items-center justify-between border-2 md:border-4 border-gold-muted rounded-xl md:rounded-2xl shadow-inner">
                 <div className="text-amber-950/40 font-mystic text-[8px] md:text-[11px] uppercase tracking-tighter border-b border-amber-900/10 w-full text-center pb-1">
                    {i === 0 ? "Le Passé" : i === 1 ? "Le Présent" : i === 2 ? "Le Futur" : "Précision"}
                 </div>
                 <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl md:text-7xl filter drop-shadow-lg">{card.image}</span>
                    <h4 className="text-center font-mystic text-[10px] md:text-lg text-amber-950 uppercase tracking-widest leading-tight">{card.name}</h4>
                 </div>
                 <div className="w-full text-center border-t border-amber-900/10 pt-2">
                    <p className="text-[7px] md:text-[11px] text-amber-900/70 font-serif italic leading-tight">{card.meaning}</p>
                 </div>
              </div>

            </div>
          </div>
        ))}
        {selectedCards.length < 3 && [...Array(3 - selectedCards.length)].map((_, i) => (
           <div key={i} className="w-28 h-44 md:w-48 md:h-72 rounded-xl md:rounded-2xl border-2 border-dashed border-gold-muted/10 flex items-center justify-center opacity-20">
              <span className="font-mystic text-[8px] md:text-xs text-gold-muted uppercase">Arcane {selectedCards.length + i + 1}</span>
           </div>
        ))}
      </div>

      {/* Questioning Phase UI */}
      {step === 'questioning' && (
        <div className="w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 space-y-6 z-50">
          <div className="text-center space-y-2">
            <h4 className="font-mystic text-gold-bright text-lg uppercase tracking-widest">Posez votre Question</h4>
            <p className="text-gold-muted/60 text-xs italic font-serif">Inscrivez votre tourment pour que Cécile l'éclaire.</p>
          </div>
          
          <div className="relative group shadow-2xl">
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Mon projet professionnel va-t-il porter ses fruits ?"
              className="w-full bg-black/90 border-2 border-gold-bright/30 p-8 rounded-[2rem] text-gold-bright text-xl md:text-2xl font-serif italic focus:border-gold-bright transition-all min-h-[160px] resize-none pr-10"
            />
            <div className="absolute right-4 bottom-4 flex gap-4">
              <button 
                type="button" 
                onClick={() => startVoiceSession()}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${voiceStatus === 'listening' ? 'bg-gold-bright text-black border-gold-bright scale-110 shadow-lg' : 'bg-black border-gold-bright/30 text-gold-bright hover:bg-gold-bright/10'}`}
              >
                🎙️
              </button>
            </div>
          </div>

          <button 
            onClick={askFinalQuestion}
            disabled={!question.trim()}
            className="w-full py-6 bg-gradient-to-r from-gold-muted via-gold-bright to-gold-muted text-black font-mystic text-xl tracking-[0.2em] uppercase rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-4"
          >
            <span>✨</span> Interroger l'Oracle <span>✨</span>
          </button>
          
          <p className="text-center font-mystic text-[8px] md:text-[10px] text-gold-muted uppercase tracking-widest opacity-60">
             (Vous pouvez aussi tirer jusqu'à 3 cartes de précision supplémentaires dans l'éventail ci-dessous)
          </p>
        </div>
      )}

      {/* Parchment Interpretation */}
      {(step === 'interpreting' || step === 'questioning') && transcript && (
        <div className="w-full max-w-4xl px-4 animate-in fade-in duration-1000 mb-12">
            <div className="parchment p-8 md:p-16 rounded-[2rem] shadow-2xl antique-border bg-[#fdf6e3] relative overflow-hidden">
                <div className="absolute top-4 right-8 font-mystic text-[10px] text-amber-900/20 uppercase tracking-widest">Le Verbe de Cécile</div>
                <div className="prose prose-stone max-w-none">
                    <p className="italic text-xl md:text-4xl text-amber-950 font-serif leading-relaxed first-letter:text-5xl md:first-letter:text-7xl first-letter:font-mystic first-letter:mr-4 first-letter:float-left first-letter:text-amber-900">
                       {transcript}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* The Deck Spread */}
      {(step === 'drawing' || (step === 'questioning' && selectedCards.length < 6)) && (
        <div className="w-full flex flex-col items-center space-y-4 md:space-y-12 pb-10">
          <h3 className="font-mystic text-gold-bright text-[10px] md:text-sm uppercase tracking-[0.6em]">
             {selectedCards.length < 3 ? "Choisissez vos 3 Arcanes Piliers" : "Ajoutez des Précisions"}
          </h3>
          <div className="relative w-full max-w-5xl h-36 md:h-48 flex justify-center items-end px-4 md:px-10 overflow-x-auto no-scrollbar">
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
                    className={`absolute w-16 h-28 md:w-32 md:h-52 back-oracle rounded-lg shadow-xl border border-gold-muted/30 transition-all duration-500 hover:-translate-y-10 hover:scale-110 active:scale-95 flex items-center justify-center ${isSelected ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100'}`}
                    style={{ transform: `translateX(${translateX}px) rotate(${rotation}deg)`, transformOrigin: 'bottom center', zIndex: i }}
                  >
                    <span className="text-xl md:text-2xl opacity-10">👁️</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 z-[110] w-full px-6 justify-center">
        <button onClick={() => { stopVoiceSession(); onBack(); }} className="px-6 md:px-12 py-4 bg-black/90 border border-gold-muted/30 text-gold-muted font-mystic text-[10px] uppercase tracking-widest rounded-full">Sortir</button>
        {(step === 'interpreting' || step === 'questioning') && (
            <button 
                onClick={() => { setStep('drawing'); setSelectedCards([]); setFlippedIndices(new Set()); setTranscript(''); setQuestion(''); startVoiceSession("Le destin se renouvelle. Choisissez trois nouvelles cartes."); }}
                className="px-6 md:px-12 py-4 bg-gold-bright text-black font-mystic text-[10px] uppercase tracking-widest rounded-full shadow-lg"
            >Nouveau Tirage</button>
        )}
      </div>

      <style>{`
        .rotate-y-180 { transform: rotateY(180deg); }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default TarotRoom;

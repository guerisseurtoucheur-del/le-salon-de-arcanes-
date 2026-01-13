
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { DeckType, TarotCard } from '../types';

const TAROT_MARSEILLE: TarotCard[] = [
  { name: "LE BATELEUR", image: "🧙", roman: "I", color: "#d4a017", meaning: "Potentiel" },
  { name: "LA PAPESSE", image: "📖", roman: "II", color: "#2b547e", meaning: "Intuition" },
  { name: "L'IMPÉRATRICE", image: "👑", roman: "III", color: "#4e9258", meaning: "Créativité" },
  { name: "L'EMPEREUR", image: "🏛️", roman: "IIII", color: "#990000", meaning: "Stabilité" },
  { name: "LE PAPE", image: "🕊️", roman: "V", color: "#990000", meaning: "Sagesse" },
  { name: "L'AMOUREUX", image: "❤️", roman: "VI", color: "#d4a017", meaning: "Choix" },
  { name: "LE CHARIOT", image: "🚜", roman: "VII", color: "#2b547e", meaning: "Action" },
  { name: "LA JUSTICE", image: "⚖️", roman: "VIII", color: "#4e9258", meaning: "Équilibre" },
  { name: "L'ERMITE", image: "🕯️", roman: "VIIII", color: "#990000", meaning: "Prudence" },
  { name: "LA ROUE DE FORTUNE", image: "🎡", roman: "X", color: "#4e9258", meaning: "Destin" },
  { name: "LA FORCE", image: "🦁", roman: "XI", color: "#990000", meaning: "Courage" },
  { name: "LE PENDU", image: "🤸", roman: "XII", color: "#2b547e", meaning: "Lâcher-prise" },
  { name: "LA MORT", image: "💀", roman: "XIII", color: "#1a1510", meaning: "Renouveau" },
  { name: "LA TEMPÉRANCE", image: "🍶", roman: "XIIII", color: "#4e9258", meaning: "Harmonie" },
  { name: "LE DIABLE", image: "😈", roman: "XV", color: "#990000", meaning: "Attachement" },
  { name: "LA MAISON DIEU", image: "🏰", roman: "XVI", color: "#d4a017", meaning: "Changement" },
  { name: "L'ÉTOILE", image: "✨", roman: "XVII", color: "#2b547e", meaning: "Espoir" },
  { name: "LA LUNE", image: "🌙", roman: "XVIII", color: "#2b547e", meaning: "Subconscient" },
  { name: "LE SOLEIL", image: "☀️", roman: "XVIIII", color: "#d4a017", meaning: "Clarté" },
  { name: "LE JUGEMENT", image: "🎺", roman: "XX", color: "#4e9258", meaning: "Bilan" },
  { name: "LE MONDE", image: "🌍", roman: "XXI", color: "#d4a017", meaning: "Totalité" },
  { name: "LE MAT", image: "🚶", roman: " ", color: "#990000", meaning: "Inconnu" },
];

const ORACLE_CARDS: TarotCard[] = [
  { name: "La Destinée", image: "🗝️", meaning: "Chemin tracé" },
  { name: "L'Élévation", image: "🧗", meaning: "Progression" },
  { name: "La Réussite", image: "🏆", meaning: "Triomphe" },
  { name: "L'Inconstance", image: "🌪️", meaning: "Doutes" },
  { name: "La Pensée", image: "💭", meaning: "Projets" },
  { name: "Le Cadeau", image: "🎁", meaning: "Surprise" },
  { name: "La Fidélité", image: "🐕", meaning: "Loyauté" },
  { name: "L'Union", image: "💍", meaning: "Engagement" },
];

const TarotRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [deckType, setDeckType] = useState<DeckType | null>(null);
  const [step, setStep] = useState<'intro' | 'drawing' | 'flipping' | 'interpreting'>('intro');
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
  const transcriptRef = useRef<HTMLDivElement>(null);

  const playSfx = (url: string, volume = 0.5) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    startVoiceSession("Bonjour voyageur... Approchez. Prenez place dans mon humble salon. Lequel de ces deux jeux appelle votre âme aujourd'hui ? Le traditionnel Tarot de Marseille ou la douce Sybille de mon Oracle ?");
    return () => stopVoiceSession();
  }, []);

  const startVoiceSession = async (initialPrompt?: string) => {
    if (sessionRef.current) {
      if (initialPrompt) {
        sessionRef.current.sendRealtimeInput({ parts: [{ text: initialPrompt }] });
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
              if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            if (initialPrompt) {
              sessionPromise.then(s => s.sendRealtimeInput({ parts: [{ text: initialPrompt }] }));
            }
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => prev + message.serverContent.outputTranscription.text);
            }
            const modelParts = message.serverContent?.modelTurn?.parts;
            if (modelParts) {
              for (const part of modelParts) {
                if (part.inlineData?.data && outputContextRef.current && outputContextRef.current.state !== 'closed') {
                  setVoiceStatus('speaking');
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
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setVoiceStatus('idle'),
          onerror: () => setVoiceStatus('idle')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une voyante lumineuse. RÉPONDS TOUJOURS EN FRANÇAIS. Ta voix est jeune, chaleureuse et très articulée. Tu guides l'utilisateur à travers son tirage. Tu es proactive : tu commentes ses choix et tu l'invites à passer à l'étape suivante. Si les 3 cartes sont retournées, interprète-les immédiatement.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputContextRef.current) outputContextRef.current.close().catch(() => {});
  };

  const selectDeck = (type: DeckType) => {
    // Son d'ouverture de jeu
    playSfx('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3', 0.6);
    setDeckType(type);
    setStep('drawing');
    const msg = type === 'MARSEILLE' 
      ? "Le Tarot de Marseille... Les arcanes majeurs, porteurs d'une sagesse ancestrale. Très bien. Concentrez-vous sur votre question, faites le vide... et choisissez trois cartes de ce tas."
      : "L'Oracle de la Sybille... Les secrets du quotidien et les murmures du coeur. Un excellent choix. Respirez profondément, visualisez votre tourment... et tirez trois cartes.";
    startVoiceSession(msg);
  };

  const drawCard = (card: TarotCard) => {
    if (selectedCards.length >= 3 || selectedCards.find(c => c.name === card.name)) return;
    
    // Son "Casino Card Deal" sec et satisfaisant
    playSfx('https://assets.mixkit.co/active_storage/sfx/158/158-preview.mp3', 0.8);
    
    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);
    
    if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Parfait. Les trois piliers de votre destinée sont posés. Retournez-les maintenant, une par une, pour que nous puissions lire ce qu'elles nous révèlent.");
    }
  };

  const flipCard = (index: number) => {
    if (step !== 'flipping') return;
    if (flippedIndices.has(index)) return;
    
    // Son de retournement de carte
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', 0.5);
    
    const newFlipped = new Set(flippedIndices);
    newFlipped.add(index);
    setFlippedIndices(newFlipped);

    if (newFlipped.size === 3) {
      setStep('interpreting');
      const cardNames = selectedCards.map(c => c.name).join(', ');
      startVoiceSession(`Ah... Je vois. Les voiles se déchirent. Nous avons tiré : ${cardNames}. Laissez-moi vous dire ce que je perçois à travers ces symboles...`);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-12">
      {/* Header Statut Cécile - Maintenu tout en haut */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[40] animate-in slide-in-from-top-4">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/80 backdrop-blur-2xl border border-gold-bright/30 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.2)]">
          <div className={`w-1.5 h-1.5 rounded-full ${voiceStatus === 'speaking' ? 'bg-green-500 animate-ping' : voiceStatus === 'listening' ? 'bg-gold-bright animate-pulse' : 'bg-gold-muted'}`}></div>
          <span className="font-mystic text-[8px] md:text-[9px] text-gold-bright uppercase tracking-[0.2em]">
            {voiceStatus === 'connecting' ? "Cécile arrive..." : voiceStatus === 'speaking' ? "Cécile vous guide..." : voiceStatus === 'listening' ? "Cécile est à votre écoute..." : "Présence en attente..."}
          </span>
        </div>
      </div>

      {step === 'intro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl px-4">
          <DeckCard 
            title="Tarot de Marseille" 
            desc="L'Arcane Sacré" 
            icon="☀️" 
            onClick={() => selectDeck('MARSEILLE')} 
            theme="back-marseille"
          />
          <DeckCard 
            title="Oracle Sybille" 
            desc="Le Miroir du Quotidien" 
            icon="👁️" 
            onClick={() => selectDeck('ORACLE')} 
            theme="back-oracle"
          />
        </div>
      )}

      {step === 'drawing' && (
        <div className="w-full flex flex-col items-center space-y-12 animate-in fade-in zoom-in duration-700">
          <p className="font-cursive text-4xl text-gold-muted italic text-center">Choisissez vos 3 cartes...</p>
          <div className="flex flex-wrap justify-center gap-4 max-w-5xl">
            {(deckType === 'MARSEILLE' ? TAROT_MARSEILLE : ORACLE_CARDS).map((card, i) => (
              <button 
                key={i}
                onClick={() => drawCard(card)}
                disabled={selectedCards.length >= 3 || !!selectedCards.find(c => c.name === card.name)}
                className={`w-24 h-40 card-back-pattern rounded shadow-2xl transition-all hover:-translate-y-6 active:scale-95 active:brightness-125 relative group overflow-hidden ${deckType === 'MARSEILLE' ? 'back-marseille' : 'back-oracle'} ${selectedCards.find(c => c.name === card.name) ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}`}
              >
                {/* Effet Sparkle au survol et clic */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-3xl drop-shadow-md relative z-10">{deckType === 'MARSEILLE' ? '☀️' : '👁️'}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            {selectedCards.map((_, i) => (
              <div key={i} className="w-16 h-24 border-2 border-gold-bright/20 rounded-lg flex items-center justify-center text-gold-bright/30 font-mystic text-xs shadow-inner bg-black/20">
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {(step === 'flipping' || step === 'interpreting') && (
        <div className="w-full flex flex-col items-center space-y-16 animate-in fade-in duration-700">
          <div className="flex flex-wrap justify-center gap-12">
            {selectedCards.map((card, i) => (
              <div 
                key={i} 
                onClick={() => flipCard(i)}
                className={`w-52 h-80 cursor-pointer perspective-1000 group ${flippedIndices.has(i) ? '' : 'hover:-translate-y-8 transition-transform active:scale-95'}`}
              >
                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${flippedIndices.has(i) ? 'rotate-y-180' : ''}`}>
                  <div className={`absolute inset-0 card-back-pattern ${deckType === 'MARSEILLE' ? 'back-marseille' : 'back-oracle'} rounded shadow-2xl backface-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-6xl drop-shadow-2xl animate-pulse">{deckType === 'MARSEILLE' ? '☀️' : '👁️'}</span>
                  </div>
                  
                  {deckType === 'MARSEILLE' ? (
                    <div className="absolute inset-0 rotate-y-180 backface-hidden card-marseille-authentic">
                      <div className="card-marseille-inner" style={{ borderColor: card.color }}>
                        <div className="card-marseille-header" style={{ color: card.color }}>{card.roman}</div>
                        <div className="card-marseille-illustration"><span className="text-8xl drop-shadow-md">{card.image}</span></div>
                        <div className="card-marseille-footer"><div className="card-marseille-title">{card.name}</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 rotate-y-180 backface-hidden rounded bg-[#fdf6e3] p-4 flex flex-col items-center justify-between border-4 border-gold-muted/30 shadow-2xl">
                        <span className="text-8xl my-auto drop-shadow-md">{card.image}</span>
                        <div className="text-center font-mystic text-amber-950 uppercase border-t border-gold-muted/20 pt-2 w-full">{card.name}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-4xl glass-mystic p-10 antique-border shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-4 font-serif italic text-2xl md:text-3xl leading-relaxed text-gold-bright drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" ref={transcriptRef}>
              {transcript || "Le destin se dévoile en silence..."}
            </div>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => { playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 0.4); setStep('intro'); setSelectedCards([]); setFlippedIndices(new Set()); startVoiceSession("Voulez-vous interroger les arcanes une nouvelle fois ?"); }}
                className="px-8 py-3 bg-amber-950 text-gold-bright border border-gold-bright/30 font-mystic text-xs uppercase tracking-[0.2em] rounded hover:bg-black transition-all shadow-[0_0_15px_rgba(255,215,0,0.1)]"
              >Recommencer le Tirage</button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton Retour permanent */}
      <button 
        onClick={() => { stopVoiceSession(); onBack(); }}
        className="fixed bottom-10 left-10 px-6 py-2 border border-gold-muted/30 text-gold-muted hover:text-gold-bright hover:border-gold-bright transition-all font-mystic text-[10px] uppercase tracking-widest z-[50]"
      >Quitter le Salon</button>
    </div>
  );
};

const DeckCard: React.FC<{ title: string, desc: string, icon: string, onClick: () => void, theme: string }> = ({ title, desc, icon, onClick, theme }) => (
  <button 
    onClick={onClick}
    className={`group relative p-12 bg-black/40 border-2 border-gold-muted/20 rounded-[2rem] overflow-hidden transition-all hover:border-gold-bright hover:shadow-[0_0_50px_rgba(255,215,0,0.2)] active:scale-95 text-center space-y-6 animate-in zoom-in-95 duration-700`}
  >
    <div className={`absolute inset-0 ${theme} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
    <span className="block text-7xl group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">{icon}</span>
    <div className="relative z-10">
      <h3 className="text-2xl font-mystic text-gold-bright uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-gold-muted font-serif italic text-lg opacity-60 group-hover:opacity-100 transition-opacity">{desc}</p>
    </div>
  </button>
);

export default TarotRoom;


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
  { name: "Le Voyage", image: "🚢", meaning: "Déplacement" },
  { name: "La Maison", image: "🏠", meaning: "Stabilité" },
  { name: "L'Argent", image: "💰", meaning: "Abondance" },
  { name: "Le Malheur", image: "🥀", meaning: "Fin de cycle" },
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

  useEffect(() => {
    const welcome = "Bonjour, je suis Cécile votre cartomancienne. Je vous propose pour commencer de tirer trois cartes. Quel jeu préférez-vous ? Le Tarot ancestral ou mon Oracle ?";
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
          systemInstruction: "Tu es Cécile, cartomancienne. RÉPONDS TOUJOURS EN FRANÇAIS. Ton ton est poétique, mystérieux mais bienveillant. Quand l'utilisateur a tiré 3 cartes, analyse-les. Puis, INVITE-LE à piocher jusqu'à 3 autres cartes pour approfondir. Dès qu'une nouvelle carte est piochée, analyse-la immédiatement en lien avec le tirage existant.",
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
    
    const newSelection = [...selectedCards, card];
    setSelectedCards(newSelection);

    if (step === 'interpreting') {
      const newFlipped = new Set(flippedIndices);
      newFlipped.add(newSelection.length - 1);
      setFlippedIndices(newFlipped);
      setTranscript(prev => prev + "\n\n"); // Espace pour la nouvelle analyse
      startVoiceSession(`Une nouvelle énergie se manifeste : ${card.name}. Écoutons ce qu'elle ajoute à notre vision...`);
    } else if (newSelection.length === 3) {
      setStep('flipping');
      startVoiceSession("Le triangle du destin est formé. Retournez vos cartes, que je puisse lire en vous.");
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
      startVoiceSession(`Le voile se lève sur ${names}. Voici mon interprétation. Si vous souhaitez des précisions, piochez de nouvelles cartes dans le jeu qui vient de réapparaître.`);
    }
  };

  const availableDeck = deckType === 'MARSEILLE' ? TAROT_MARSEILLE : ORACLE_CARDS;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start space-y-12 pb-24">
      {/* Voice Feedback UI */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-3 px-6 py-3 bg-black/90 backdrop-blur-xl rounded-full border transition-all duration-500 ${voiceStatus === 'speaking' ? 'border-gold-bright shadow-[0_0_25px_rgba(255,215,0,0.3)] scale-105' : 'border-gold-bright/10'}`}>
        <div className="flex gap-1 items-end h-4">
           {[...Array(5)].map((_, i) => (
             <div 
               key={i} 
               className={`w-1 bg-gold-bright rounded-full transition-all duration-300 ${voiceStatus === 'speaking' ? 'animate-pulse' : 'h-1 opacity-20'}`}
               style={{ height: voiceStatus === 'speaking' ? `${30 + Math.random() * 70}%` : '4px', animationDelay: `${i * 0.1}s` }}
             ></div>
           ))}
        </div>
        <span className="font-mystic text-xs text-gold-bright uppercase tracking-widest">{voiceStatus === 'speaking' ? "Cécile déchiffre les signes..." : "Cécile est à votre écoute..."}</span>
      </div>

      {step === 'intro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl px-4 pt-12">
          <button onClick={() => { setDeckType('MARSEILLE'); setStep('drawing'); startVoiceSession("Le Tarot de Marseille. La puissance des traditions. Tirez trois cartes pour commencer."); }} className="group p-12 glass-mystic rounded-[3rem] border-2 border-gold-muted/20 hover:border-gold-bright transition-all text-center space-y-6 hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]">
             <span className="text-8xl block group-hover:scale-110 transition-transform">🧙‍♂️</span>
             <h3 className="text-3xl font-mystic text-gold-bright uppercase tracking-widest">Le Tarot de Marseille</h3>
             <p className="text-gold-muted/60 font-serif italic">Les 22 Arcanes Majeurs du destin.</p>
          </button>
          <button onClick={() => { setDeckType('ORACLE'); setStep('drawing'); startVoiceSession("L'Oracle. La clarté des visions. Choisissez trois cartes."); }} className="group p-12 glass-mystic rounded-[3rem] border-2 border-gold-muted/20 hover:border-gold-bright transition-all text-center space-y-6 hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]">
             <span className="text-8xl block group-hover:scale-110 transition-transform">🔮</span>
             <h3 className="text-3xl font-mystic text-gold-bright uppercase tracking-widest">Oracle</h3>
             <p className="text-gold-muted/60 font-serif italic">Des scènes révélatrices du futur.</p>
          </button>
        </div>
      )}

      {/* Cartes piochées (actives) */}
      {(step === 'flipping' || step === 'interpreting' || (step === 'drawing' && selectedCards.length > 0)) && (
        <div className="w-full max-w-6xl flex flex-wrap justify-center gap-6 pt-10 px-4">
          {selectedCards.map((card, i) => (
            <div 
                key={i} 
                onClick={() => flipCard(i)} 
                className={`w-36 h-56 md:w-44 md:h-72 cursor-pointer perspective-1000 group ${flippedIndices.has(i) ? 'rotate-y-180' : 'hover:-translate-y-4 transition-transform'}`}
            >
              <div className="relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl">
                <div className={`absolute inset-0 card-back-pattern rounded-xl flex items-center justify-center backface-hidden border-2 border-gold-muted/30 ${deckType === 'MARSEILLE' ? 'back-marseille' : 'back-oracle'}`}>
                   <span className="text-4xl text-gold-bright opacity-30 group-hover:opacity-100 transition-opacity">{deckType === 'MARSEILLE' ? '☀️' : '👁️'}</span>
                </div>
                <div className="absolute inset-0 rotate-y-180 backface-hidden rounded-xl bg-gradient-to-br from-[#fdf6e3] to-[#dccba0] p-3 flex flex-col items-center justify-between border-4 border-gold-muted shadow-2xl">
                   <div className="text-amber-950 font-mystic text-sm uppercase opacity-40">{card.roman || ''}</div>
                   <span className="text-7xl md:text-8xl filter drop-shadow-lg">{card.image}</span>
                   <div className="text-center w-full border-t border-amber-900/20 pt-2">
                     <span className="text-[10px] md:text-xs font-mystic text-amber-950 uppercase tracking-widest">{card.name}</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone de l'Oracle (Parchemin d'interprétation) */}
      {step === 'interpreting' && (
        <div className="w-full max-w-4xl px-6 animate-in fade-in duration-1000">
            <div className="parchment p-10 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] antique-border relative group">
                <div className="absolute top-4 left-6 flex gap-1 opacity-20">
                   <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                   <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                   <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                </div>
                <div className="prose prose-stone max-w-none">
                    <p className="italic text-2xl md:text-3xl text-amber-950 font-serif leading-relaxed first-letter:text-6xl first-letter:font-mystic first-letter:mr-3 first-letter:float-left first-letter:text-amber-900">
                       {transcript || "Cécile consulte les sphères..."}
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Pile de cartes / Deck de pioche (Apparaît au début et après l'analyse) */}
      {(step === 'drawing' || (step === 'interpreting' && selectedCards.length < 6)) && (
        <div className="w-full flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="text-center">
             <p className="font-mystic text-gold-bright/60 text-xs uppercase tracking-[0.5em] mb-4">
                {selectedCards.length === 0 ? "Choisissez 3 cartes pour commencer" : 
                 selectedCards.length < 3 ? `Encore ${3 - selectedCards.length} à piocher...` : 
                 "Le jeu est ouvert. Piochez jusqu'à 3 cartes supplémentaires."}
             </p>
             <div className="h-1 w-24 bg-gold-muted/20 mx-auto rounded-full"></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 px-8 max-w-5xl">
            {availableDeck.map((card, i) => {
              const isSelected = selectedCards.find(c => c.name === card.name);
              return (
                <button 
                  key={i} 
                  onClick={() => drawCard(card)} 
                  disabled={!!isSelected}
                  className={`relative w-16 h-28 md:w-24 md:h-40 card-back-pattern rounded-lg shadow-xl hover:-translate-y-6 transition-all border border-gold-muted/30 ${deckType === 'MARSEILLE' ? 'back-marseille' : 'back-oracle'} ${isSelected ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100'}`}
                >
                  <div className="absolute inset-0 bg-gold-bright/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                  <span className="text-2xl md:text-4xl opacity-10">{deckType === 'MARSEILLE' ? '☀️' : '👁️'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation et Actions */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
        <button 
            onClick={() => { stopVoiceSession(); onBack(); }} 
            className="px-8 py-4 bg-black/80 backdrop-blur-md border border-gold-muted/30 text-gold-muted hover:text-gold-bright transition-all font-mystic text-[10px] uppercase tracking-[0.4em] rounded-full shadow-2xl"
        >
          Sortir du Salon
        </button>
        {step === 'interpreting' && (
            <button 
                onClick={() => {
                    setStep('intro');
                    setSelectedCards([]);
                    setFlippedIndices(new Set());
                    setTranscript('');
                    startVoiceSession("Le destin est un livre que l'on peut rouvrir sans cesse. Quel jeu choisissons-nous pour cette nouvelle séance ?");
                }}
                className="px-10 py-4 bg-gold-bright text-black border border-gold-bright transition-all font-mystic text-[10px] uppercase tracking-[0.4em] rounded-full shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95"
            >
              Nouveau Tirage
            </button>
        )}
      </div>
    </div>
  );
};

export default TarotRoom;

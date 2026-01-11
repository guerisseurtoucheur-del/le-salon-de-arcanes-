
import React, { useState, useEffect, useRef } from 'react';
import { DeckType, TarotCard, ViewType } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

interface TarotViewProps {
  onNavigate?: (view: ViewType) => void;
  onSaveReading?: (cards: TarotCard[], text: string) => void;
}

const MARSEILLE_CARDS: TarotCard[] = [
  { romanNumeral: "I", name: "Le Bateleur", image: "🧙", meaning: "Nouveau départ, potentiel, habileté." },
  { romanNumeral: "II", name: "La Papesse", image: "📖", meaning: "Intuition, sagesse cachée, mystère." },
  { romanNumeral: "III", name: "L'Impératrice", image: "👑", meaning: "Créativité, fertilité, abundance." },
  { romanNumeral: "IIII", name: "L'Empereur", image: "🏛️", meaning: "Autorité, structure, stabilité." },
  { romanNumeral: "V", name: "Le Pape", image: "🕊️", meaning: "Tradition, conseil, spiritualité." },
  { romanNumeral: "VI", name: "L'Amoureux", image: "❤️", meaning: "Choix, relations, harmonie." },
  { romanNumeral: "VII", name: "Le Chariot", image: "🚜", meaning: "Victoire, détermination, voyage." },
  { romanNumeral: "VIII", name: "La Justice", image: "⚖️", meaning: "Équilibre, vérité, responsabilité." },
  { romanNumeral: "VIIII", name: "L'Ermite", image: "🕯️", meaning: "Solitude, introspection, recherche." },
  { romanNumeral: "X", name: "La Roue de Fortune", image: "🎡", meaning: "Changement, cycles, destin." },
  { romanNumeral: "XI", name: "La Force", image: "🦁", meaning: "Courage, maîtrise de soi, patience." },
  { romanNumeral: "XII", name: "Le Pendu", image: "🤸", meaning: "Lâcher-prise, perspective, sacrifice." },
  { romanNumeral: "XIII", name: "L'Arcane sans nom", image: "💀", meaning: "Transformation, fin, renouveau." },
  { romanNumeral: "XIIII", name: "La Tempérance", image: "🍶", meaning: "Modération, flux, alchimie." },
  { romanNumeral: "XV", name: "Le Diable", image: "😈", meaning: "Passion, tentation, attachement." },
  { romanNumeral: "XVI", name: "La Maison Dieu", image: "🏰", meaning: "Bouleversement, libération, éveil." },
  { romanNumeral: "XVII", name: "L'Étoile", image: "✨", meaning: "Espoir, inspiration, sérénité." },
  { romanNumeral: "XVIII", name: "La Lune", image: "🌙", meaning: "Rêves, illusions, subconscient." },
  { romanNumeral: "XVIIII", name: "Le Soleil", image: "☀️", meaning: "Joie, succès, vitalité." },
  { romanNumeral: "XX", name: "Le Jugement", image: "🎺", meaning: "Renaissance, bilan, appel." },
  { romanNumeral: "XXI", name: "Le Monde", image: "🌍", meaning: "Accomplissement, plénitude, succès." },
  { romanNumeral: "", name: "Le Mat", image: "🚶", meaning: "Inconnu, liberté, voyage intérieur." },
];

const SYBILLE_CARDS: TarotCard[] = [
  { name: "La Fidélité", image: "🐕", meaning: "Loyauté, attachement, amitié.", playingCard: "10♥" },
  { name: "Le Cadeau", image: "🎁", meaning: "Surprise, gain, générosité.", playingCard: "9♦" },
  { name: "La Lettre", image: "✉️", meaning: "Nouvelles, communication.", playingCard: "7♠" },
  { name: "Le Voyage", image: "🚢", meaning: "Déplacement, aventure.", playingCard: "A♣" },
  { name: "La Rencontre", image: "🤝", meaning: "Contact social, opportunité.", playingCard: "V♥" },
  { name: "Le Mariage", image: "💍", meaning: "Union, engagement, contrat.", playingCard: "A♥" },
  { name: "La Maison", image: "🏠", meaning: "Foyer, sécurité, famille.", playingCard: "10♦" },
  { name: "La Pensée", image: "💭", meaning: "Réflexion, projets.", playingCard: "9♥" },
  { name: "Le Malheur", image: "🌪️", meaning: "Obstacle, épreuve passagère.", playingCard: "9♠" },
  { name: "La Réussite", image: "🏆", meaning: "Triomphe, satisfaction.", playingCard: "10♣" },
  { name: "L'Argent", image: "💰", playingCard: "10♠", meaning: "Prospérité, finances." },
  { name: "La Maladie", image: "🛌", playingCard: "9♣", meaning: "Repos forcé, fatigue." },
  { name: "Le Jaloux", image: "🐍", playingCard: "V♣", meaning: "Envie, médisance." },
  { name: "La Surprise", image: "🎆", playingCard: "7♥", meaning: "Étonnement, imprévu." },
];

const TarotView: React.FC<TarotViewProps> = ({ onNavigate, onSaveReading }) => {
  const [deckType, setDeckType] = useState<DeckType | null>(null);
  const [step, setStep] = useState<'selection' | 'shuffling' | 'reading'>('selection');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [isFlipped, setIsFlipped] = useState<boolean[]>([false, false, false]);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<'repos' | 'connexion' | 'oracle-parle'>('repos');
  const [oracleText, setOracleText] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [oracleText]);

  const startTarotReading = (type: DeckType) => {
    setDeckType(type);
    setSelectedCards([]);
    setIsFlipped([false, false, false]);
    setStep('shuffling');
    setOracleText("");
    setTimeout(() => setStep('reading'), 2000);
  };

  const drawCard = () => {
    if (selectedCards.length >= 3) return;
    const cards = deckType === 'MARSEILLE' ? MARSEILLE_CARDS : SYBILLE_CARDS;
    
    let randomCard;
    do {
      randomCard = cards[Math.floor(Math.random() * cards.length)];
    } while (selectedCards.find(c => c.name === randomCard.name));

    setSelectedCards(prev => [...prev, randomCard]);
  };

  const flipCard = (index: number) => {
    const newFlipped = [...isFlipped];
    newFlipped[index] = true;
    setIsFlipped(newFlipped);
  };

  const startOracleLive = async () => {
    setStatus('connexion');
    setOracleText("");
    try {
      // Use direct process.env.API_KEY as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use cross-browser AudioContext initialization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardDetails = selectedCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}: ${c.romanNumeral || ''} ${c.name}`).join(", ");
      const systemPrompt = `Tu es Cécile, l'oracle de ce salon. Ton client vient de tirer 3 cartes : ${cardDetails}. Réponds avec profondeur, mystère et poésie.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setStatus('oracle-parle');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              // Initiate sendRealtimeInput after sessionPromise resolves to avoid race condition
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              setOracleText(prev => prev + message.serverContent.outputTranscription.text);
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          },
          onclose: () => stopOracle(),
          onerror: () => stopOracle()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('repos');
    }
  };

  const stopOracle = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    setIsLive(false);
    setStatus('repos');
  };

  if (step === 'selection') {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-12">
        <h2 className="text-6xl font-serif-ornate font-black text-gold drop-shadow-2xl">Le Salon des Destinées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-4">
          <DeckSelectionCard 
            title="Le Tarot de Marseille" 
            desc="L'Arcane Sacré du XVe siècle. Gravures de bois, couleurs primaires, sagesse éternelle." 
            img="🃏"
            onClick={() => startTarotReading('MARSEILLE')}
          />
          <DeckSelectionCard 
            title="La Sybille des Salons" 
            desc="L'Oracle du XIXe siècle. Scènes de vie, lithographies élégantes et secrets du quotidien." 
            img="🔮"
            onClick={() => startTarotReading('SYBILLE')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full tapis-velours rounded-lg border-4 border-gold/40 shadow-inner overflow-hidden">
      <div className="flex justify-between items-center p-8 border-b border-gold/20 z-10">
        <button onClick={() => setStep('selection')} className="text-gold/60 hover:text-gold flex items-center gap-3 font-serif-ornate uppercase tracking-widest text-xs transition-all">
          <span className="text-xl">←</span> Sortir du Salon
        </button>
        <div className="flex flex-col items-center">
            <h3 className="text-2xl font-serif-ornate font-bold text-gold tracking-[0.4em] uppercase">{deckType === 'MARSEILLE' ? 'Tarot de Marseille' : 'Sybille des Salons'}</h3>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-gold to-transparent opacity-40 mt-1"></div>
        </div>
        <div className="w-32"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-16 relative overflow-y-auto">
        {step === 'shuffling' ? (
          <div className="flex flex-col items-center gap-8 animate-pulse">
            <div className="relative w-40 h-64">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="absolute inset-0 card-back-pattern rounded shadow-2xl" style={{ transform: `rotate(${i * 15 - 45}deg) translate(${i * 5}px, 0)` }}></div>
              ))}
            </div>
            <p className="text-gold/80 font-cursive text-4xl">L'Oracle mélange les possibles...</p>
          </div>
        ) : (
          <>
            {selectedCards.length < 3 ? (
              <div className="text-center space-y-12">
                <p className="text-3xl text-amber-100/60 font-cursive italic">Concentrez-vous... Écoutez l'appel des Arcanes.</p>
                <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                  {[...Array(12)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={drawCard}
                      className="w-24 h-40 card-back-pattern border-gold/30 rounded shadow-2xl transition-all duration-300 hover:-translate-y-6 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] active:scale-95 group relative overflow-hidden"
                    >
                       <div className="card-back-ornament scale-[0.4] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-16">
                <div className="flex flex-wrap justify-center gap-12 lg:gap-24">
                  {selectedCards.map((card, i) => (
                    <div key={i} className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${i * 200}ms` }}>
                      <span className="text-[10px] font-serif-ornate uppercase tracking-[0.5em] text-gold/40 mb-2">{i === 0 ? "Le Passé" : i === 1 ? "Le Présent" : "Le Futur"}</span>
                      <TarotCardComponent 
                        card={card} 
                        isFlipped={isFlipped[i]} 
                        onClick={() => flipCard(i)}
                        deckType={deckType!}
                      />
                    </div>
                  ))}
                </div>

                {isFlipped.every(v => v) && !isLive && (
                  <div className="flex flex-col items-center gap-8 animate-in fade-in duration-1000">
                    <button 
                      onClick={startOracleLive}
                      className="group relative px-16 py-6 overflow-hidden rounded-sm"
                    >
                      <div className="absolute inset-0 bg-gold/10 border-2 border-gold/50 transition-all group-hover:bg-gold group-hover:text-black"></div>
                      <span className="relative z-10 text-gold group-hover:text-black font-serif-ornate font-bold text-xl tracking-widest uppercase">ÉCOUTER LA PROPHÉTIE</span>
                    </button>
                  </div>
                )}

                {(isLive || oracleText) && (
                  <div className="w-full max-w-5xl flex flex-col items-center gap-12 mb-12">
                    <div className="parchment p-12 antique-border shadow-[0_0_100px_rgba(0,0,0,0.6)] relative group w-full">
                        <div className="absolute -top-8 -right-8 w-16 h-16 wax-seal rounded-full flex items-center justify-center text-white/50 text-xl shadow-2xl">C</div>
                        <div className="max-h-96 overflow-y-auto scroll-smooth font-serif text-2xl leading-relaxed text-amber-950 pr-6 custom-scrollbar" ref={transcriptScrollRef}>
                            {oracleText ? (
                                <p className="animate-in fade-in duration-1000 first-letter:text-6xl first-letter:font-serif-ornate first-letter:float-left first-letter:mr-4 first-letter:text-red-900 italic">
                                    {oracleText}
                                </p>
                            ) : (
                                <div className="flex items-center justify-center h-48 italic text-amber-900/40">
                                    L'Oracle entre en transe... Le silence précède la vision.
                                </div>
                            )}
                        </div>
                    </div>
                    {!isLive && oracleText && (
                        <button 
                           onClick={() => {
                               onSaveReading?.(selectedCards, oracleText);
                               onNavigate?.(ViewType.CHAT);
                           }}
                           className="flex flex-col items-center gap-4 group"
                        >
                            <div className="wax-seal w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                                <span className="text-3xl">🖋️</span>
                            </div>
                            <span className="text-gold font-serif-ornate uppercase tracking-widest text-xs">Approfondir ce secret</span>
                        </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const DeckSelectionCard: React.FC<{ title: string; desc: string; img: string; onClick: () => void }> = ({ title, desc, img, onClick }) => (
  <button 
    onClick={onClick}
    className="parchment p-10 rounded-sm antique-border group text-left hover:scale-[1.02] transition-all relative overflow-hidden"
  >
    <div className="absolute -bottom-10 -right-10 text-[12rem] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">{img}</div>
    <div className="flex items-center gap-6 mb-8">
        <span className="text-6xl drop-shadow-lg">{img}</span>
        <h4 className="text-3xl font-serif-ornate font-bold text-amber-950 uppercase tracking-widest">{title}</h4>
    </div>
    <p className="text-xl text-amber-900 leading-relaxed font-serif italic border-l-4 border-amber-900/20 pl-6">{desc}</p>
    <div className="mt-10 flex items-center justify-between">
        <span className="text-[10px] font-serif-ornate uppercase tracking-widest text-amber-900/60">Sélectionner ce jeu</span>
        <span className="text-amber-900 text-2xl group-hover:translate-x-2 transition-transform">→</span>
    </div>
  </button>
);

const TarotCardComponent: React.FC<{ card: TarotCard; isFlipped: boolean; onClick: () => void; deckType: DeckType }> = ({ card, isFlipped, onClick, deckType }) => (
  <div 
    onClick={onClick}
    className={`w-52 h-80 md:w-64 md:h-[420px] cursor-pointer perspective-1000 transition-all duration-700 group ${isFlipped ? '' : 'hover:-translate-y-8'}`}
  >
    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      {/* DOS DE CARTE (Vert et Or, style image utilisateur) */}
      <div className="absolute inset-0 card-back-pattern rounded-sm flex items-center justify-center backface-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="card-back-ornament"></div>
      </div>

      {/* FACE DE CARTE (Style Ancien Lithographie/Gravure avec structure à 3 boites) */}
      <div className={`absolute inset-0 rounded-sm rotate-y-180 backface-hidden card-antique-container p-1 overflow-hidden`}>
        <div className="card-inner-frame">
          {/* Haut : Numéro (Cartouche supérieure) */}
          <div className="card-label-box card-top-label">
            {deckType === 'MARSEILLE' ? (card.romanNumeral || "•") : (card.playingCard || "•")}
          </div>

          {/* Centre : Illustration (Zone centrale) */}
          <div className="card-illustration-zone litho-filter">
             <div className="text-[10rem] md:text-[12rem] drop-shadow-sm filter contrast-125 saturate-75">
               {card.image}
             </div>
             {/* Overlay de texture pour l'illustration pour casser le côté trop "émoticône" */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] opacity-40 pointer-events-none"></div>
             <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/5 via-transparent to-amber-900/5"></div>
          </div>

          {/* Bas : Cartouche du Nom (Cartouche inférieure) */}
          <div className="card-label-box card-bottom-label">
            {card.name}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TarotView;

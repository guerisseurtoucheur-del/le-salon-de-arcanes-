
import React, { useState, useEffect, useRef } from 'react';
import { DeckType, TarotCard, ViewType } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

interface TarotViewProps {
  onNavigate?: (view: ViewType) => void;
  onSaveReading?: (cards: TarotCard[], text: string) => void;
}

const MARSEILLE_CARDS: TarotCard[] = [
  { romanNumeral: "I", name: "LE BATELEUR", image: "🧙", meaning: "Nouveau départ, potentiel, habileté." },
  { romanNumeral: "II", name: "LA PAPESSE", image: "📖", meaning: "Intuition, sagesse cachée, mystère." },
  { romanNumeral: "III", name: "L'IMPÉRATRICE", image: "👑", meaning: "Créativité, fertilité, abundance." },
  { romanNumeral: "IIII", name: "L'EMPEREUR", image: "🏛️", meaning: "Autorité, structure, stability." },
  { romanNumeral: "V", name: "LE PAPE", image: "🕊️", meaning: "Tradition, conseil, spiritualité." },
  { romanNumeral: "VI", name: "L'AMOUREUX", image: "❤️", meaning: "Choix, relations, harmonie." },
  { romanNumeral: "VII", name: "LE CHARIOT", image: "🚜", meaning: "Victoire, détermination, voyage." },
  { romanNumeral: "VIII", name: "LA JUSTICE", image: "⚖️", meaning: "Équilibre, vérité, responsabilité." },
  { romanNumeral: "VIIII", name: "L'ERMITE", image: "🕯️", meaning: "Solitude, introspection, recherche." },
  { romanNumeral: "X", name: "LA ROUE DE FORTUNE", image: "🎡", meaning: "Changement, cycles, destin." },
  { romanNumeral: "XI", name: "LA FORCE", image: "🦁", meaning: "Courage, mastery de soi, patience." },
  { romanNumeral: "XII", name: "LE PENDU", image: "🤸", meaning: "Lâcher-prise, perspective, sacrifice." },
  { romanNumeral: "XIII", name: "LA MORT", image: "💀", meaning: "Transformation, fin, renouveau." },
  { romanNumeral: "XIIII", name: "LA TEMPÉRANCE", image: "🍶", meaning: "Modération, flux, alchimie." },
  { romanNumeral: "XV", name: "LE DIABLE", image: "😈", meaning: "Passion, tentation, attachement." },
  { romanNumeral: "XVI", name: "LA MAISON DIEU", image: "🏰", meaning: "Bouleversement, libération, éveil." },
  { romanNumeral: "XVII", name: "L'ÉTOILE", image: "✨", meaning: "Espoir, inspiration, sérénité." },
  { romanNumeral: "XVIII", name: "LA LUNE", image: "🌙", meaning: "Rêves, illusions, subconscient." },
  { romanNumeral: "XVIIII", name: "LE SOLEIL", image: "☀️", meaning: "Joie, succès, vitalité." },
  { romanNumeral: "XX", name: "LE JUGEMENT", image: "🎺", meaning: "Renaissance, bilan, appel." },
  { romanNumeral: "XXI", name: "LE MONDE", image: "🌍", meaning: "Accomplissement, plénitude, succès." },
  { romanNumeral: "", name: "LE MAT", image: "🚶", meaning: "Inconnu, liberté, voyage intérieur." },
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardDetails = selectedCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}: ${c.romanNumeral || ''} ${c.name}`).join(", ");
      const systemPrompt = `Tu es Cécile. Tu as une voix jeune, claire et une élocution parfaitement distincte. Tu commentes un tirage de 3 cartes : ${cardDetails}. Réponds avec mystère mais sois très articulée et compréhensible. Ta voix est mélodieuse et précise.`;

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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
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

  const getDeckBackClass = () => deckType === 'MARSEILLE' ? 'back-marseille' : 'back-oracle';
  const getDeckBackIcon = () => deckType === 'MARSEILLE' ? '☀️' : '👁️';

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
    <div className="flex flex-col h-full tapis-velours rounded-lg border-4 border-gold/40 shadow-inner overflow-hidden bg-purple-950/20">
      <div className="flex justify-between items-center p-8 border-b border-gold/20 z-10">
        <button onClick={() => setStep('selection')} className="text-gold/60 hover:text-gold flex items-center gap-3 font-serif-ornate uppercase tracking-widest text-xs transition-all">
          <span className="text-xl">←</span> Sortir du Salon
        </button>
        <div className="flex flex-col items-center">
            <h3 className="text-2xl font-serif-ornate font-bold text-gold tracking-[0.4em] uppercase">{deckType === 'MARSEILLE' ? 'Tarot de Marseille' : 'Sybille des Salons'}</h3>
        </div>
        <div className="w-32"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-16 relative overflow-y-auto">
        {step === 'shuffling' ? (
          <div className="flex flex-col items-center gap-8 animate-pulse">
            <p className="text-gold/80 font-cursive text-4xl">L'Oracle mélange les possibles...</p>
          </div>
        ) : (
          <>
            {selectedCards.length < 3 ? (
              <div className="text-center space-y-12">
                <p className="text-3xl text-amber-100/60 font-cursive italic">Concentrez-vous... Écoutez l'appel des Arcanes.</p>
                <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                  {[...Array(12)].map((_, i) => (
                    <button key={i} onClick={drawCard} className={`w-24 h-40 card-back-pattern ${getDeckBackClass()} border-gold/30 rounded shadow-2xl transition-all hover:-translate-y-6 flex flex-col items-center justify-center`}>
                       <span className="text-3xl drop-shadow-md">{getDeckBackIcon()}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-16">
                <div className="flex flex-wrap justify-center gap-12 lg:gap-24">
                  {selectedCards.map((card, i) => (
                    <TarotCardComponent key={i} card={card} isFlipped={isFlipped[i]} onClick={() => flipCard(i)} backClass={getDeckBackClass()} backIcon={getDeckBackIcon()} deckType={deckType!} />
                  ))}
                </div>

                {isFlipped.every(v => v) && !isLive && (
                  <button onClick={startOracleLive} className="px-16 py-6 bg-gold/10 border-2 border-gold/50 text-gold font-serif-ornate font-bold text-xl uppercase">ÉCOUTER LA PROPHÉTIE</button>
                )}

                {(isLive || oracleText) && (
                  <div className="parchment p-12 antique-border shadow-2xl w-full max-w-5xl">
                    <div className="max-h-96 overflow-y-auto font-serif text-2xl leading-relaxed text-amber-950" ref={transcriptScrollRef}>
                      {oracleText || "L'Oracle entre en transe..."}
                    </div>
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
  <button onClick={onClick} className="parchment p-10 rounded-sm antique-border group text-left hover:scale-[1.02] transition-all">
    <h4 className="text-3xl font-serif-ornate font-bold text-amber-950 mb-4">{title}</h4>
    <p className="text-xl text-amber-900 italic">{desc}</p>
  </button>
);

const TarotCardComponent: React.FC<{ card: TarotCard; isFlipped: boolean; onClick: () => void; backClass: string; backIcon: string; deckType: DeckType }> = ({ card, isFlipped, onClick, backClass, backIcon, deckType }) => (
  <div onClick={onClick} className={`w-52 h-80 cursor-pointer perspective-1000 ${isFlipped ? '' : 'hover:-translate-y-8'}`}>
    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      <div className={`absolute inset-0 card-back-pattern ${backClass} rounded shadow-2xl backface-hidden flex items-center justify-center`}>
         <span className="card-back-icon">{backIcon}</span>
      </div>
      
      {deckType === 'MARSEILLE' ? (
        <div className="absolute inset-0 rotate-y-180 backface-hidden card-marseille-authentic">
          <div className="card-marseille-inner">
            <div className="card-marseille-header">{card.romanNumeral || ' '}</div>
            <div className="card-marseille-illustration">
              <span className="text-8xl drop-shadow-md">{card.image}</span>
            </div>
            <div className="card-marseille-footer">
              <div className="card-marseille-title">{card.name}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 rounded rotate-y-180 backface-hidden card-antique-container p-4 bg-[#fdf6e3]">
          <div className="h-full w-full border-2 border-gold-muted/20 flex flex-col items-center justify-between py-2">
            <div className="text-xs font-bold text-amber-900 opacity-40 uppercase">{card.romanNumeral || 'Oracle'}</div>
            <div className="text-8xl flex items-center justify-center my-auto">{card.image}</div>
            <div className="text-center font-bold text-amber-950 font-mystic uppercase tracking-widest border-t border-gold-muted/30 pt-2 w-full">{card.name}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default TarotView;

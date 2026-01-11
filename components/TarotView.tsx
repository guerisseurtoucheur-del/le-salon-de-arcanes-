
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
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardDetails = selectedCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}: ${c.romanNumeral || ''} ${c.name}`).join(", ");
      const systemPrompt = `Tu es Cécile, l'oracle de ce salon. Ton client vient de tirer 3 cartes : ${cardDetails}.
      
      INSTRUCTIONS CRITIQUES :
      1. Délivre ton interprétation d'un SEUL TRAIT, sans t'interrompre et sans poser de questions à l'interlocuteur. 
      2. Ta réponse doit être un long monologue poétique, détaillé et mystérieux.
      3. Structure : 
         - Une salutation immersive.
         - Analyse détaillée du Passé (1ère carte).
         - Analyse détaillée du Présent (2ème carte).
         - Analyse détaillée du Futur (3ème carte).
         - Une conclusion profonde et une recommandation finale.
      4. Ne t'arrête jamais avant d'avoir conclu.
      5. Ton ton est calme, posé, mystique. Réponds exclusivement en français.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setStatus('oracle-parle');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(s => {
                s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
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
              if (scriptProcessorRef.current) {
                scriptProcessorRef.current.onaudioprocess = null;
              }

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              const buffer = await decodeAudioData(decodeAudio(audioData), outputContextRef.current, 24000, 1);
              const source = outputContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputContextRef.current.destination);
              source.onended = () => {
                // Peut être utilisé pour détecter la fin réelle de l'audio
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            if (message.serverContent?.turnComplete) {
              console.log("Prophétie terminée.");
              // Attendre un peu que l'audio finisse avant de permettre l'approfondissement
              setTimeout(() => {
                onSaveReading?.(selectedCards, oracleText);
              }, 1000);
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
        <h2 className="text-5xl font-serif-ornate font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 tracking-wider">Le Salon de Cécile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          <DeckCard 
            title="Tarot de Marseille" 
            desc="L'art sacré des arcanes majeurs. Une guidance spirituelle profonde." 
            img="🃏"
            onClick={() => startTarotReading('MARSEILLE')}
          />
          <DeckCard 
            title="Sybille des Salons" 
            desc="Un oracle authentique du XIXe siècle pour explorer le quotidien." 
            img="🔮"
            onClick={() => startTarotReading('SYBILLE')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 min-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center glass p-4 rounded-2xl border-amber-500/20">
        <button onClick={() => setStep('selection')} className="text-slate-400 hover:text-white flex items-center gap-2 font-serif">
          ← Sortir du salon
        </button>
        <h3 className="text-xl font-serif-ornate font-bold text-amber-400 tracking-wider">Le Salon de Cécile</h3>
        <div className="w-24"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {step === 'shuffling' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-48">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`absolute inset-0 bg-slate-800 border-2 border-amber-500/50 rounded-xl animate-pulse`} style={{ transform: `rotate(${i * 5}deg) translate(${i * 2}px, ${i * 2}px)` }}></div>
              ))}
            </div>
            <p className="text-amber-200 animate-pulse text-lg font-serif italic">Mélange des arcanes...</p>
          </div>
        ) : (
          <div className="space-y-12 w-full flex flex-col items-center">
            {selectedCards.length < 3 ? (
              <div className="text-center space-y-8">
                <p className="text-2xl text-slate-300 font-serif px-4 italic">Concentrez-vous... Tirez <span className="text-amber-400 font-bold">{3 - selectedCards.length}</span> carte(s)</p>
                <div className="flex flex-wrap justify-center gap-4 px-4">
                  {[...Array(8)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={drawCard}
                      className="w-24 h-36 bg-amber-900 border-2 border-amber-600/30 rounded-lg hover:-translate-y-4 hover:border-amber-400 transition-all duration-300 shadow-lg relative overflow-hidden group"
                    >
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40"></div>
                       <div className="absolute inset-2 border border-amber-500/20 rounded"></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12 w-full px-4">
                <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                  {selectedCards.map((card, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-serif font-bold">{i === 0 ? "Passé" : i === 1 ? "Présent" : "Futur"}</span>
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
                  <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <button 
                      onClick={startOracleLive}
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 px-12 py-4 rounded-full font-serif-ornate font-bold text-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
                    >
                      Écouter la Prophétie
                    </button>
                  </div>
                )}

                {(isLive || oracleText) && (
                  <div className="flex flex-col items-center gap-8 w-full max-w-4xl animate-in fade-in duration-1000">
                    <div className="flex flex-col items-center gap-4">
                      {isLive && (
                        <>
                          <div className="w-16 h-16 bg-amber-500 rounded-full animate-ping absolute opacity-20"></div>
                          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center relative shadow-lg">
                             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                             </svg>
                          </div>
                        </>
                      )}
                      <p className="text-amber-400 font-serif italic text-xl">
                        {isLive ? "Cécile est en transe..." : "La prophétie est scellée."}
                      </p>
                    </div>

                    <div className="w-full parchment rounded-sm p-8 antique-border shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40"></div>
                      <div className="relative h-64 overflow-y-auto scroll-smooth font-serif text-lg leading-relaxed text-amber-950 pr-4 custom-scrollbar" ref={transcriptScrollRef}>
                        {oracleText ? (
                          <p className="animate-in fade-in duration-500 italic first-letter:text-4xl first-letter:font-serif-ornate first-letter:float-left first-letter:mr-2">
                            {oracleText}
                          </p>
                        ) : (
                          <p className="text-amber-900/30 text-center flex items-center justify-center h-full">
                            La plume attend le premier murmure...
                          </p>
                        )}
                      </div>
                    </div>

                    {!isLive && oracleText && (
                      <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 duration-1000">
                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
                        <p className="text-amber-100/60 font-serif italic text-center max-w-lg">
                          "Certains mystères demandent à être explorés plus en avant. Voulez-vous m'interroger sur un point précis de cette vision ?"
                        </p>
                        <button 
                          onClick={() => {
                            onSaveReading?.(selectedCards, oracleText);
                            onNavigate?.(ViewType.CHAT);
                          }}
                          className="relative group flex items-center justify-center"
                        >
                          <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl group-hover:bg-gold/40 transition-all animate-pulse"></div>
                          <div className="wax-seal w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 border-gold/50 shadow-2xl transform group-hover:scale-110 transition-transform group-active:scale-95">
                            <span className="text-white font-serif-ornate font-bold text-xs tracking-tighter text-center px-2">APPROFONDIR</span>
                            <span className="text-white text-lg">🖋️</span>
                          </div>
                        </button>
                      </div>
                    )}

                    {isLive && (
                      <button onClick={stopOracle} className="text-slate-500 hover:text-rose-400 text-sm font-serif underline transition-colors">Interrompre la séance</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DeckCard: React.FC<{ title: string; desc: string; img: string; onClick: () => void }> = ({ title, desc, img, onClick }) => (
  <button 
    onClick={onClick}
    className="glass p-8 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all group text-left space-y-6 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <span className="text-9xl">{img}</span>
    </div>
    <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">
      {img}
    </div>
    <h4 className="text-3xl font-serif-ornate font-bold text-white group-hover:text-amber-400 transition-colors">{title}</h4>
    <p className="text-slate-400 leading-relaxed text-lg font-serif italic">{desc}</p>
    <div className="flex items-center text-amber-500 font-serif font-bold gap-2">
      <span>Ouvrir</span>
      <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </div>
  </button>
);

const TarotCardComponent: React.FC<{ card: TarotCard; isFlipped: boolean; onClick: () => void; deckType: DeckType }> = ({ card, isFlipped, onClick, deckType }) => (
  <div 
    onClick={onClick}
    className={`w-44 h-72 md:w-56 md:h-96 cursor-pointer perspective-1000 transition-all duration-700 ${isFlipped ? '' : 'hover:-translate-y-4'}`}
  >
    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      <div className="absolute inset-0 bg-[#3a1a0e] border-8 border-[#d4af37] rounded-sm flex flex-col items-center justify-center backface-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-2 border-2 border-[#d4af37]/30 flex items-center justify-center">
            <div className="w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/vintage-speckles.png')]"></div>
            <div className="absolute text-7xl opacity-40 font-serif-ornate text-[#d4af37]">C</div>
        </div>
      </div>
      <div className={`absolute inset-0 rounded-sm flex flex-col rotate-y-180 backface-hidden shadow-2xl overflow-hidden
        ${deckType === 'SYBILLE' 
          ? 'bg-[#f8eed3] border-[6px] border-[#2c2c2c]' 
          : 'bg-[#f4e4bc] border-[10px] border-[#1e1e1e]'}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-60 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-20 pointer-events-none"></div>

        {deckType === 'SYBILLE' ? (
          <div className="h-full flex flex-col relative p-1">
            <div className="absolute top-2 left-2 w-10 h-14 bg-white border border-black/40 rounded-sm shadow-sm flex flex-col items-center justify-center z-10">
                <span className={`text-lg font-black leading-none ${card.playingCard?.includes('♥') || card.playingCard?.includes('♦') ? 'text-red-700' : 'text-black'}`}>
                  {card.playingCard?.replace(/[♥♦♣♠]/g, '')}
                </span>
                <span className={`text-xl leading-none ${card.playingCard?.includes('♥') || card.playingCard?.includes('♦') ? 'text-red-700' : 'text-black'}`}>
                   {card.playingCard?.slice(-1)}
                </span>
            </div>
            <div className="mt-4 flex-1 flex flex-col items-center justify-center border-2 border-black/10 mx-2 bg-white/30 rounded shadow-inner overflow-hidden relative">
               <div className="text-8xl md:text-9xl z-10 grayscale-[0.3] contrast-125 saturate-50 brightness-90 transform hover:scale-110 transition-transform">
                 {card.image}
               </div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
            </div>
            <div className="h-16 flex flex-col items-center justify-center text-center">
              <span className="font-cursive text-2xl md:text-3xl text-amber-950 leading-none">{card.name}</span>
              <span className="text-[10px] font-serif uppercase tracking-widest text-amber-900/60 mt-1">{card.meaning.split(',')[0]}</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col relative">
            <div className="h-12 flex items-center justify-center border-b-[3px] border-[#2b427b]/80 bg-white/20">
              <span className="font-serif-ornate font-black text-2xl text-[#2b427b] tracking-[0.3em]">{card.romanNumeral}</span>
            </div>
            <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-transparent via-[#fdf6e3]/30 to-transparent">
              <div className="text-9xl md:text-[10rem] drop-shadow-[4px_4px_0px_rgba(43,66,123,0.3)] filter contrast-150 brightness-95">
                {card.image}
              </div>
            </div>
            <div className="h-16 border-t-[3px] border-[#c8242a] bg-white/60 flex flex-col items-center justify-center relative">
               <div className="absolute inset-1 border border-[#c8242a]/20"></div>
               <span className="text-lg md:text-xl font-serif-ornate font-black uppercase tracking-tighter text-[#c8242a] leading-tight">
                 {card.name}
               </span>
               <div className="flex gap-4 mt-1">
                 <div className="w-8 h-[2px] bg-[#ebb624]"></div>
                 <div className="w-2 h-2 rounded-full bg-[#2b427b]"></div>
                 <div className="w-8 h-[2px] bg-[#ebb624]"></div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default TarotView;

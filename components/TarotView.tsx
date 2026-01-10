
import React, { useState, useEffect, useRef } from 'react';
import { DeckType, TarotCard } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const MARSEILLE_CARDS: TarotCard[] = [
  { romanNumeral: "I", name: "Le Bateleur", image: "🧙", meaning: "Nouveau départ, potentiel, habileté." },
  { romanNumeral: "II", name: "La Papesse", image: "📖", meaning: "Intuition, sagesse cachée, mystère." },
  { romanNumeral: "III", name: "L'Impératrice", image: "👑", meaning: "Créativité, fertilité, abondance." },
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

const TarotView: React.FC = () => {
  const [deckType, setDeckType] = useState<DeckType | null>(null);
  const [step, setStep] = useState<'selection' | 'shuffling' | 'reading'>('selection');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [isFlipped, setIsFlipped] = useState<boolean[]>([false, false, false]);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState<'repos' | 'connexion' | 'oracle-parle'>('repos');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  const startTarotReading = (type: DeckType) => {
    setDeckType(type);
    setSelectedCards([]);
    setIsFlipped([false, false, false]);
    setStep('shuffling');
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardDetails = selectedCards.map(c => `${c.romanNumeral || ''} ${c.name}`).join(", ");
      const systemPrompt = `Tu es l'Oracle du Salon des Arcanes, une entité mystique experte en cartomancie spécialisée dans le ${deckType === 'MARSEILLE' ? 'Tarot de Marseille' : 'Sybille des Salons'}. 
      L'utilisateur vient de tirer 3 cartes : ${cardDetails}. 
      1. Commence par : "Bienvenue au Salon des Arcanes. Je suis votre guide. Vos cartes ont été révélées..."
      2. Interprète les 3 cartes (Passé, Présent, Futur).
      3. Ton ton doit être celui d'un vieux sage ou d'une sybille élégante.
      4. Réponds en français uniquement.`;

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
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
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
        <h2 className="text-5xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Le Salon des Arcanes</h2>
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
        <h3 className="text-xl font-serif font-bold text-amber-400">{deckType === 'MARSEILLE' ? 'Tarot de Marseille' : 'Sybille des Salons'}</h3>
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
                      className="w-24 h-36 bg-slate-900 border-2 border-amber-600/30 rounded-lg hover:-translate-y-4 hover:border-amber-400 transition-all duration-300 shadow-lg relative overflow-hidden group"
                    >
                       <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent"></div>
                       <div className="absolute inset-2 border border-amber-500/10 rounded"></div>
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
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 px-12 py-4 rounded-full font-serif font-bold text-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
                    >
                      Interroger l'Oracle
                    </button>
                  </div>
                )}

                {isLive && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-full animate-ping absolute opacity-20"></div>
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center relative shadow-lg">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                       </svg>
                    </div>
                    <p className="text-amber-400 font-serif italic text-xl">L'Oracle vous parle...</p>
                    <button onClick={stopOracle} className="text-slate-500 hover:text-rose-400 text-sm font-serif underline mt-4">Terminer la consultation</button>
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
    <h4 className="text-3xl font-serif font-bold text-white group-hover:text-amber-400 transition-colors">{title}</h4>
    <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
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
    className={`w-44 h-64 md:w-52 md:h-80 cursor-pointer perspective-1000 transition-all duration-700 ${isFlipped ? '' : 'hover:-translate-y-2'}`}
  >
    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      {/* Front (Dos) */}
      <div className="absolute inset-0 bg-slate-900 border-2 border-amber-600/50 rounded-xl flex flex-col items-center justify-center p-4 backface-hidden shadow-2xl">
        <div className="absolute inset-2 border border-amber-500/10 rounded-lg"></div>
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent flex items-center justify-center">
           <span className="text-5xl opacity-20">✨</span>
        </div>
      </div>
      
      {/* Back (Révélée) */}
      <div className={`absolute inset-0 rounded-xl flex flex-col rotate-y-180 backface-hidden shadow-2xl overflow-hidden bg-[#fdf6e3] text-slate-900
        ${deckType === 'SYBILLE' ? 'border-[6px] border-[#d4af37]' : 'border-[6px] border-[#2b427b]'}`}>
        
        {deckType === 'SYBILLE' ? (
          <div className="h-full flex flex-col relative border border-[#d4af37]/40 p-1">
            <div className="absolute top-1 left-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-sm">
                <span className={`text-lg font-bold ${card.playingCard?.includes('♥') || card.playingCard?.includes('♦') ? 'text-red-600' : 'text-slate-900'}`}>
                  {card.playingCard}
                </span>
            </div>
            <div className="mt-8 text-center">
              <span className="text-sm font-serif font-bold uppercase tracking-tight leading-tight block border-b border-slate-200 pb-1 px-4">{card.name}</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-8xl drop-shadow-lg">{card.image}</div>
            <div className="mb-2 text-center px-2 py-1 bg-slate-100/50 rounded border-t border-slate-200">
               <span className="text-[11px] font-serif italic leading-none">{card.meaning}</span>
            </div>
          </div>
        ) : (
          /* Design Tarot de Marseille Authentique */
          <div className="h-full flex flex-col relative border border-[#2b427b]/30">
            {/* Cartouche Chiffre Romain (Top) */}
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center border-b border-[#2b427b]/20 bg-white/50">
              <span className="font-serif font-bold text-lg text-[#2b427b] tracking-widest">{card.romanNumeral}</span>
            </div>

            {/* Illustration centrale */}
            <div className="flex-1 flex items-center justify-center text-8xl md:text-9xl drop-shadow-xl my-8">
              {card.image}
            </div>

            {/* Cartouche Nom de l'Arcane (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-white flex items-center justify-center border-t-2 border-[#2b427b]">
               <div className="text-center w-full px-1">
                 <span className="text-sm md:text-base font-serif font-bold uppercase tracking-tighter text-[#2b427b] leading-none block">{card.name}</span>
                 <span className="text-[9px] text-slate-400 font-serif italic block mt-0.5 truncate">{card.meaning}</span>
               </div>
            </div>
            
            {/* Décoration de bordure interne typique */}
            <div className="absolute inset-1 border border-[#2b427b]/10 pointer-events-none"></div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default TarotView;

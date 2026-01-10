
import React, { useState, useEffect, useRef } from 'react';
import { DeckType, TarotCard } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const MARSEILLE_CARDS: TarotCard[] = [
  { name: "Le Bateleur", image: "🃏", meaning: "Nouveau départ, potentiel, habileté." },
  { name: "La Papesse", image: "📖", meaning: "Intuition, sagesse cachée, mystère." },
  { name: "L'Impératrice", image: "👑", meaning: "Créativité, fertilité, abondance." },
  { name: "L'Empereur", image: "🏛️", meaning: "Autorité, structure, stabilité." },
  { name: "Le Pape", image: "🕊️", meaning: "Tradition, conseil, spiritualité." },
  { name: "L'Amoureux", image: "❤️", meaning: "Choix, relations, harmonie." },
  { name: "Le Chariot", image: "🚜", meaning: "Victoire, détermination, voyage." },
  { name: "La Justice", image: "⚖️", meaning: "Équilibre, vérité, responsabilité." },
  { name: "L'Ermite", image: "🕯️", meaning: "Solitude, introspection, recherche." },
  { name: "La Roue de Fortune", image: "🎡", meaning: "Changement, cycles, destin." },
  { name: "La Force", image: "🦁", meaning: "Courage, maîtrise de soi, patience." },
  { name: "Le Pendu", image: "🤸", meaning: "Lâcher-prise, perspective, sacrifice." },
  { name: "L'Arcane sans nom", image: "💀", meaning: "Transformation, fin, renouveau." },
  { name: "La Tempérance", image: "🍶", meaning: "Modération, flux, alchimie." },
  { name: "Le Diable", image: "😈", meaning: "Passion, tentation, attachement." },
  { name: "La Maison Dieu", image: "🏰", meaning: "Bouleversement, libération, éveil." },
  { name: "L'Étoile", image: "✨", meaning: "Espoir, inspiration, sérénité." },
  { name: "La Lune", image: "🌙", meaning: "Rêves, illusions, subconscient." },
  { name: "Le Soleil", image: "☀️", meaning: "Joie, succès, vitalité." },
  { name: "Le Jugement", image: "🎺", meaning: "Renaissance, bilan, appel." },
  { name: "Le Monde", image: "🌍", meaning: "Accomplissement, plénitude, succès." },
  { name: "Le Mat", image: "🚶", meaning: "Inconnu, liberté, voyage intérieur." },
];

const SYBILLE_CARDS: TarotCard[] = [
  { name: "La Fidélité", image: "🐕", meaning: "Loyauté, attachement, amitié sincère." },
  { name: "Le Cadeau", image: "🎁", meaning: "Surprise agréable, gain, générosité." },
  { name: "La Lettre", image: "✉️", meaning: "Nouvelles, communication, information." },
  { name: "Le Voyage", image: "🚢", meaning: "Déplacement, changement d'air, aventure." },
  { name: "La Rencontre", image: "🤝", meaning: "Contact social, nouvelle personne, opportunité." },
  { name: "Le Mariage", image: "💍", meaning: "Union, engagement, contrat solide." },
  { name: "La Maison", image: "🏠", meaning: "Foyer, sécurité, famille." },
  { name: "La Pensée", image: "💭", meaning: "Réflexion, souci, projets futurs." },
  { name: "Le Malheur", image: "🌪️", meaning: "Obstacle, épreuve passagère, tristesse." },
  { name: "La Réussite", image: "🏆", meaning: "Triomphe, satisfaction, aboutissement." },
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
    setStep('shuffling');
    setTimeout(() => setStep('reading'), 2000);
  };

  const drawCard = (cardIndex: number) => {
    if (selectedCards.length >= 3) return;
    const cards = deckType === 'MARSEILLE' ? MARSEILLE_CARDS : SYBILLE_CARDS;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
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

      const cardNames = selectedCards.map(c => c.name).join(", ");
      const systemPrompt = `Tu es l'Oracle du Salon des Arcanes, une entité mystique experte en cartomancie spécialisée dans le ${deckType === 'MARSEILLE' ? 'Tarot de Marseille' : 'Sybille des Salons'}. 
      L'utilisateur vient de tirer 3 cartes dans ton salon : ${cardNames}. 
      1. Commence ton intervention par : "Bienvenue au Salon des Arcanes. Je suis votre guide. Vos cartes ont été révélées..."
      2. Interprète ces 3 cartes comme le Passé, le Présent et le Futur de manière poétique, profonde et mystérieuse. 
      3. Utilise un ton de voix calme, légèrement solennel et très empathique. Réponds en français uniquement.`;

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
        <p className="text-amber-200/60 font-serif italic text-xl">Quel Oracle souhaitez-vous consulter aujourd'hui ?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <DeckCard 
            title="Tarot de Marseille" 
            desc="L'art sacré des arcanes majeurs pour une guidance spirituelle profonde et universelle." 
            img="🃏"
            onClick={() => startTarotReading('MARSEILLE')}
          />
          <DeckCard 
            title="Sybille des Salons" 
            desc="Un oracle raffiné pour explorer les mystères du quotidien, des sentiments et des rencontres." 
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
                <div key={i} className={`absolute inset-0 bg-slate-800 border-2 border-amber-500/50 rounded-xl shadow-2xl animate-pulse`} style={{ transform: `rotate(${i * 5}deg) translate(${i * 2}px, ${i * 2}px)` }}></div>
              ))}
            </div>
            <p className="text-amber-200 animate-pulse text-lg font-serif italic">Les énergies se mêlent dans le salon...</p>
          </div>
        ) : (
          <div className="space-y-12 w-full flex flex-col items-center">
            {selectedCards.length < 3 ? (
              <div className="text-center space-y-8">
                <p className="text-2xl text-slate-300 font-serif">Concentrez-vous sur votre question...<br/>Tirez <span className="text-amber-400 font-bold">{3 - selectedCards.length}</span> carte(s)</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {[...Array(8)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => drawCard(i)}
                      className="w-24 h-36 bg-slate-900 border-2 border-amber-600/30 rounded-lg hover:-translate-y-4 hover:border-amber-400 transition-all duration-300 shadow-lg relative overflow-hidden group"
                    >
                       <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent"></div>
                       <div className="absolute inset-2 border border-amber-500/10 rounded"></div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12 w-full">
                <div className="flex justify-center gap-8">
                  {selectedCards.map((card, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-serif font-bold">{i === 0 ? "Passé" : i === 1 ? "Présent" : "Futur"}</span>
                      <TarotCardComponent 
                        card={card} 
                        isFlipped={isFlipped[i]} 
                        onClick={() => flipCard(i)} 
                      />
                    </div>
                  ))}
                </div>
                
                {isFlipped.every(v => v) && (
                  <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {!isLive ? (
                      <button 
                        onClick={startOracleLive}
                        className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 px-12 py-4 rounded-full font-serif font-bold text-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105"
                      >
                        Consulter l'Oracle du Salon
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-amber-500 rounded-full animate-ping absolute opacity-20"></div>
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center relative shadow-lg">
                           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                           </svg>
                        </div>
                        <p className="text-amber-400 font-serif italic text-xl">L'Oracle déchiffre votre destin...</p>
                        <button onClick={stopOracle} className="text-slate-500 hover:text-rose-400 text-sm font-serif underline mt-4">Terminer la consultation</button>
                      </div>
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
    <h4 className="text-3xl font-serif font-bold text-white group-hover:text-amber-400 transition-colors">{title}</h4>
    <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
    <div className="flex items-center text-amber-500 font-serif font-bold gap-2">
      <span>Prendre place</span>
      <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </div>
  </button>
);

const TarotCardComponent: React.FC<{ card: TarotCard; isFlipped: boolean; onClick: () => void }> = ({ card, isFlipped, onClick }) => (
  <div 
    onClick={onClick}
    className={`w-40 h-64 cursor-pointer perspective-1000 transition-all duration-700 ${isFlipped ? '' : 'hover:-translate-y-2'}`}
  >
    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
      {/* Front */}
      <div className="absolute inset-0 bg-slate-900 border-2 border-amber-600/50 rounded-xl flex flex-col items-center justify-center p-4 backface-hidden shadow-2xl">
        <div className="absolute inset-2 border border-amber-500/10 rounded"></div>
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent flex items-center justify-center">
           <span className="text-4xl opacity-20">✨</span>
        </div>
      </div>
      
      {/* Back (Revealed) */}
      <div className="absolute inset-0 bg-white border-4 border-amber-500 rounded-xl flex flex-col items-center justify-between p-4 rotate-y-180 backface-hidden shadow-[0_0_40px_rgba(245,158,11,0.2)]">
        <div className="text-slate-800 font-serif font-bold text-xs uppercase tracking-tighter text-center h-8 flex items-center leading-none px-1">{card.name}</div>
        <div className="text-6xl my-4">{card.image}</div>
        <div className="text-[10px] text-slate-500 italic text-center leading-tight font-serif">{card.meaning}</div>
      </div>
    </div>
  </div>
);

export default TarotView;

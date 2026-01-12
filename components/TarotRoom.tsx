
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const TAROT_MARSEILLE = [
  { name: "LE BATELEUR", image: "🧙", roman: "I", color: "#d4a017" },
  { name: "LA PAPESSE", image: "📖", roman: "II", color: "#2b547e" },
  { name: "L'IMPÉRATRICE", image: "👑", roman: "III", color: "#4e9258" },
  { name: "L'EMPEREUR", image: "🏛️", roman: "IIII", color: "#990000" },
  { name: "LE PAPE", image: "🕊️", roman: "V", color: "#990000" },
  { name: "L'AMOUREUX", image: "❤️", roman: "VI", color: "#d4a017" },
  { name: "LE CHARIOT", image: "🚜", roman: "VII", color: "#2b547e" },
  { name: "LA JUSTICE", image: "⚖️", roman: "VIII", color: "#4e9258" },
  { name: "L'ERMITE", image: "🕯️", roman: "VIIII", color: "#990000" },
  { name: "LA ROUE DE FORTUNE", image: "🎡", roman: "X", color: "#4e9258" },
  { name: "LA FORCE", image: "🦁", roman: "XI", color: "#990000" },
  { name: "LE PENDU", image: "🤸", roman: "XII", color: "#2b547e" },
  { name: "LA MORT", image: "💀", roman: "XIII", color: "#1a1510" },
  { name: "LA TEMPÉRANCE", image: "🍶", roman: "XIIII", color: "#4e9258" },
  { name: "LE DIABLE", image: "😈", roman: "XV", color: "#990000" },
  { name: "LA MAISON DIEU", image: "🏰", roman: "XVI", color: "#d4a017" },
  { name: "L'ÉTOILE", image: "✨", roman: "XVII", color: "#2b547e" },
  { name: "LA LUNE", image: "🌙", roman: "XVIII", color: "#2b547e" },
  { name: "LE SOLEIL", image: "☀️", roman: "XVIIII", color: "#d4a017" },
  { name: "LE JUGEMENT", image: "🎺", roman: "XX", color: "#4e9258" },
  { name: "LE MONDE", image: "🌍", roman: "XXI", color: "#d4a017" },
  { name: "LE MAT", image: "🚶", roman: " ", color: "#990000" },
];

const RIDER_WAITE = [
  { name: "Le Magicien", image: "✨" },
  { name: "La Grande Prêtresse", image: "🌙" },
  { name: "L'Impératrice", image: "🌿" },
  { name: "L'Empereur", image: "🛡️" },
  { name: "Le Hiérophante", image: "🛐" },
  { name: "L'Amoureux", image: "🕊️" },
  { name: "La Force", image: "🦁" },
  { name: "L'Étoile", image: "⭐" },
];

const ORACLE_CARDS = [
  { name: "La Destinée", image: "🗝️" },
  { name: "L'Élévation", image: "🧗" },
  { name: "La Réussite", image: "🏆" },
  { name: "L'Inconstance", image: "🌪️" },
  { name: "La Pensée", image: "💭" },
  { name: "Le Cadeau", image: "🎁" },
  { name: "La Fidélité", image: "🐕" },
  { name: "L'Union", image: "💍" },
];

const TarotRoom: React.FC<{ onBack: () => void }> = () => {
  const [deckType, setDeckType] = useState<'MARSEILLE' | 'RIDER_WAITE' | 'ORACLE'>('MARSEILLE');
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [isReading, setIsReading] = useState(false);
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<HTMLDivElement>(null);

  const MAX_ADDITIONAL_CARDS = 3;
  const INITIAL_CARDS_COUNT = 3;
  const MAX_TOTAL_CARDS = INITIAL_CARDS_COUNT + MAX_ADDITIONAL_CARDS;

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    return () => stopVoiceSession();
  }, []);

  const drawCards = async () => {
    let sourceDeck;
    if (deckType === 'MARSEILLE') sourceDeck = TAROT_MARSEILLE;
    else if (deckType === 'RIDER_WAITE') sourceDeck = RIDER_WAITE;
    else sourceDeck = ORACLE_CARDS;

    const shuffled = [...sourceDeck].sort(() => 0.5 - Math.random());
    const drawn = shuffled.slice(0, 3);
    setSelectedCards(drawn);
    setIsReading(true);
    setTranscript('');
    
    setTimeout(() => {
      startVoiceSession(drawn);
    }, 600);
  };

  const deepenReading = () => {
    if (selectedCards.length >= MAX_TOTAL_CARDS) return;

    let sourceDeck;
    if (deckType === 'MARSEILLE') sourceDeck = TAROT_MARSEILLE;
    else if (deckType === 'RIDER_WAITE') sourceDeck = RIDER_WAITE;
    else sourceDeck = ORACLE_CARDS;

    const available = sourceDeck.filter(card => !selectedCards.find(sc => sc.name === card.name));
    if (available.length === 0) return;

    const extraCard = available[Math.floor(Math.random() * available.length)];
    const newSelection = [...selectedCards, extraCard];
    setSelectedCards(newSelection);
    
    if (sessionRef.current) {
        sessionRef.current.sendRealtimeInput({
          parts: [{ text: `Cécile, j'ai ajouté une carte d'approfondissement : ${extraCard.name}. Peux-tu l'interpréter en lien avec les autres cartes ? C'est ma ${newSelection.length - INITIAL_CARDS_COUNT}ème carte supplémentaire.` }]
        });
    } else {
        startVoiceSession(newSelection);
    }
  };

  const startVoiceSession = async (cardsForContext?: any[]) => {
    if (sessionRef.current) return;
    setVoiceStatus('connecting');
    setTranscript('');

    const activeCards = cardsForContext || selectedCards;
    if (!activeCards || activeCards.length === 0) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await audioContextRef.current.resume();
      await outputContextRef.current.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardNames = activeCards.map((c, i) => {
          let pos = i === 0 ? "Passé" : i === 1 ? "Présent" : i === 2 ? "Futur" : `Approfondissement ${i - 2}`;
          return `${pos} : ${c.name}`;
      }).join(', ');
      
      const deckName = deckType === 'MARSEILLE' ? 'Tarot de Marseille' : deckType === 'RIDER_WAITE' ? 'Rider-Waite' : 'Oracle Mystique';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setVoiceStatus('listening');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            sessionPromise.then((session) => {
              const prompt = `Cécile, voici un tirage de l'${deckName}. Les cartes sont : ${cardNames}. Interprète ce message avec ta sagesse. À la fin, si le tirage comporte moins de 6 cartes, propose toujours à la personne de tirer une carte supplémentaire (jusqu'à 3 maximum) dans les cases d'approfondissement pour éclairer davantage sa destinée.`;
              session.sendRealtimeInput({
                parts: [{ text: prompt }]
              });
            });
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => prev + message.serverContent.outputTranscription.text);
            }

            const modelParts = message.serverContent?.modelTurn?.parts;
            if (modelParts) {
              for (const part of modelParts) {
                if (part.text && !message.serverContent.outputTranscription) {
                  setTranscript(prev => prev + part.text);
                }

                if (part.inlineData?.data && outputContextRef.current && outputContextRef.current.state !== 'closed') {
                  setVoiceStatus('speaking');
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                  
                  const buffer = await decodeAudioData(
                    decodeAudio(part.inlineData.data),
                    outputContextRef.current,
                    24000,
                    1
                  );
                  
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
          onclose: () => stopVoiceSession(),
          onerror: (err) => {
            console.error("Erreur Session Live:", err);
            stopVoiceSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `Tu es Cécile, une voyante lumineuse. RÉPONDS TOUJOURS EN FRANÇAIS.
          Ta voix est claire, apaisante et articulée.
          IMPORTANT : Tu peux suggérer à l'utilisateur d'ajouter jusqu'à 3 cartes supplémentaires (6 au total) s'il souhaite approfondir. Une fois les 6 cartes atteintes, dis-lui que le tirage est complet.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Échec initiation voix:", err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (outputContextRef.current && outputContextRef.current.state !== 'closed') {
      outputContextRef.current.close().catch(() => {});
    }
    
    setIsVoiceActive(false);
    setVoiceStatus('idle');
  };

  const getDeckBackClass = () => {
    if (deckType === 'MARSEILLE') return 'back-marseille';
    if (deckType === 'RIDER_WAITE') return 'back-rider';
    return 'back-oracle';
  };

  return (
    <div className="space-y-12 py-6">
      <div className="flex justify-center flex-wrap gap-4">
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('MARSEILLE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 py-2 font-mystic tracking-widest transition-all rounded border-2 ${deckType === 'MARSEILLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-lg' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >MARSEILLE</button>
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('RIDER_WAITE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 py-2 font-mystic tracking-widest transition-all rounded border-2 ${deckType === 'RIDER_WAITE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-lg' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >RIDER-WAITE</button>
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('ORACLE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 py-2 font-mystic tracking-widest transition-all rounded border-2 ${deckType === 'ORACLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-lg' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >ORACLE</button>
      </div>

      {!isReading ? (
        <div className="text-center py-10">
          <div className="mb-10 flex justify-center gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-28 h-44 card-back-pattern ${getDeckBackClass()} shadow-xl`}></div>
            ))}
          </div>
          <button 
            onClick={drawCards}
            className="px-12 py-4 bg-purple-900 text-gold-bright font-mystic text-xl border-2 border-gold-bright hover:scale-105 transition-all shadow-2xl"
          >
            Tirer les Cartes
          </button>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-700">
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Cartes tirées */}
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="text-[10px] font-mystic uppercase text-gold-muted tracking-widest">
                  {i === 0 ? 'Passé' : i === 1 ? 'Présent' : i === 2 ? 'Futur' : `Vision +${i-2}`}
                </span>
                
                {deckType === 'MARSEILLE' ? (
                  <div className="w-44 h-72 card-marseille-authentic hover:-translate-y-2 transition-transform">
                    <div className="card-marseille-inner" style={{ borderColor: card.color }}>
                      <div className="card-marseille-header" style={{ color: card.color }}>{card.roman}</div>
                      <div className="card-marseille-illustration"><span className="text-6xl drop-shadow-lg">{card.image}</span></div>
                      <div className="card-marseille-footer"><div className="card-marseille-title text-xs">{card.name}</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-72 bg-[#fdf6e3] border-4 border-gold-muted shadow-xl rounded-sm p-4 flex flex-col items-center justify-between hover:-translate-y-2 transition-transform">
                        <span className="text-6xl my-4 drop-shadow-md">{card.image}</span>
                        <h4 className="font-mystic text-amber-950 text-sm text-center uppercase border-t border-gold-muted/20 pt-2 w-full">{card.name}</h4>
                  </div>
                )}
              </div>
            ))}

            {/* Cases vides pour approfondir (jusqu'à 3 max) */}
            {Array.from({ length: MAX_TOTAL_CARDS - selectedCards.length }).map((_, idx) => {
              const isFirstEmpty = idx === 0;
              return (
                <div key={`empty-${idx}`} className="flex flex-col items-center gap-4 animate-in fade-in duration-1000" style={{ opacity: isFirstEmpty ? 1 : 0.3 }}>
                   <span className="text-[10px] font-mystic uppercase text-gold-bright/40 tracking-widest">Approfondir</span>
                   <button 
                     onClick={isFirstEmpty ? deepenReading : undefined}
                     disabled={voiceStatus === 'connecting' || !isFirstEmpty}
                     className={`w-44 h-72 rounded border-2 border-dashed border-gold-bright/20 flex flex-col items-center justify-center gap-4 bg-gold-bright/5 transition-all ${isFirstEmpty ? 'hover:bg-gold-bright/10 hover:border-gold-bright/40 group' : 'cursor-not-allowed'}`}
                   >
                     <span className={`text-4xl text-gold-bright/30 ${isFirstEmpty ? 'group-hover:scale-125 transition-transform' : ''}`}>{isFirstEmpty ? '+' : ''}</span>
                     <span className="text-[10px] font-mystic text-gold-bright/30 uppercase tracking-widest">{isFirstEmpty ? 'Ajouter une carte' : 'Case suivante'}</span>
                   </button>
                </div>
              );
            })}
          </div>
          
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            <div className="w-full space-y-6 animate-in fade-in duration-1000">
              <div className="flex justify-between items-center bg-black/40 p-3 border border-gold-bright/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${voiceStatus === 'speaking' ? 'bg-green-500 animate-ping' : voiceStatus === 'connecting' ? 'bg-amber-500' : 'bg-gold-bright'}`}></div>
                  <span className="font-mystic text-[10px] text-gold-bright uppercase tracking-widest">
                    {voiceStatus === 'connecting' ? "Cécile arrive..." : voiceStatus === 'speaking' ? "Cécile interprète vos arcanes..." : "Cécile est à votre écoute..."}
                  </span>
                </div>
                {isVoiceActive && (
                  <button onClick={stopVoiceSession} className="text-red-400 text-[10px] uppercase font-mystic hover:text-red-300 transition-colors">Interrompre la séance</button>
                )}
              </div>

              <div className="parchment p-8 antique-border shadow-2xl min-h-[150px] max-h-[300px] overflow-y-auto bg-[#fdf6e3] custom-scrollbar" ref={transcriptRef}>
                <p className="font-serif italic text-xl leading-relaxed text-amber-950">
                  {transcript || (voiceStatus === 'connecting' ? "L'Oracle se concentre..." : "Cécile va bientôt s'exprimer...")}
                </p>
              </div>

              <div className="text-center animate-in zoom-in duration-500">
                <div className="inline-block px-8 py-3 bg-purple-950/40 border border-gold-bright/30 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                  <p className="text-sm font-mystic text-gold-bright uppercase tracking-[0.2em] animate-pulse">
                    Cécile est à votre écoute. Demandez-lui à voix haute d'analyser votre tirage.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
                {selectedCards.length < MAX_TOTAL_CARDS && (
                  <button 
                    disabled={voiceStatus === 'connecting'}
                    onClick={deepenReading} 
                    className="px-8 py-3 bg-gold-bright text-purple-950 font-mystic text-xs uppercase tracking-[0.2em] rounded border-2 border-gold-bright hover:bg-transparent hover:text-gold-bright transition-all disabled:opacity-30"
                  >
                    Approfondir le tirage
                  </button>
                )}
                <button 
                  disabled={voiceStatus === 'connecting'}
                  onClick={() => { setIsReading(false); stopVoiceSession(); }} 
                  className="px-8 py-3 text-gold-muted hover:text-gold-bright font-mystic text-xs uppercase tracking-[0.2em] rounded border-2 border-gold-muted/30 hover:border-gold-bright transition-all disabled:opacity-30"
                >
                  Nouveau Tirage
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotRoom;

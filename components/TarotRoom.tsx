
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
    
    // Attendre la fin du rendu des cartes pour lancer la voix
    setTimeout(() => {
      startVoiceSession(drawn);
    }, 600);
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

      const cardNames = activeCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'} : ${c.name}`).join(', ');
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

            // Message initial plus direct pour forcer l'IA à parler
            sessionPromise.then((session) => {
              const prompt = `Cécile, voici un tirage de l'${deckName}. Les cartes sorties sont : ${cardNames}. Offre immédiatement une interprétation mystique et poétique de ce message en FRANÇAIS. Ne pose pas de question au début, commence directement la lecture.`;
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
          systemInstruction: `RÈGLE ABSOLUE : RÉPONDS EXCLUSIVEMENT EN FRANÇAIS.
          Tu es Cécile, une cartomancienne experte. Ta voix est jeune, lumineuse et parfaitement articulée. 
          Tu es spécialisée dans le Tarot de Marseille, le Rider-Waite et l'Oracle Mystique (un jeu de cartes symboliques).
          CONTEXTE DU TIRAGE : Un tirage de l'${deckName} a été effectué. 
          CARTES : ${cardNames}. 
          MISSION : Dès l'ouverture, interprète immédiatement ces cartes avec poésie. Si c'est l'Oracle Mystique, sois attentive aux noms des cartes qui décrivent des états d'âme.
          Ne parle jamais anglais. Sois concise, mystérieuse et bienveillante.`,
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
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 0.2}s` }}>
                <span className="text-[10px] font-mystic uppercase text-gold-muted tracking-widest">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                
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

              {voiceStatus === 'listening' && (
                <div className="text-center animate-pulse">
                  <p className="text-[10px] font-mystic text-gold-muted uppercase tracking-[0.2em]">Posez vos questions à voix haute pour lever le voile.</p>
                </div>
              )}
            </div>

            <button 
              disabled={voiceStatus === 'connecting'}
              onClick={() => { setIsReading(false); stopVoiceSession(); }} 
              className="mt-4 text-gold-muted/60 hover:text-gold-bright font-mystic text-[10px] uppercase tracking-[0.3em] transition-colors disabled:opacity-20 flex items-center gap-2"
            >
              <span className="text-lg">↺</span> Nouveau Tirage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotRoom;

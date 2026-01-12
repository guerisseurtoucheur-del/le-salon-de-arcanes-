
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const TAROT_MARSEILLE = [
  { name: "LE BATELEUR", image: "🧙", roman: "I", color: "#d4a017" },
  { name: "LA PAPESSE", image: "📖", roman: "II", color: "#2b547e" },
  { name: "L'IMPÉRATRICE", image: "👑", roman: "III", color: "#4e9258" },
  { name: "L'EMPEREUR", image: "🛡️", roman: "IIII", color: "#990000" },
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
  { name: "L'ÉTOILE", image: "⭐", roman: "XVII", color: "#2b547e" },
  { name: "LA LUNE", image: "🌙", roman: "XVIII", color: "#2b547e" },
  { name: "LE SOLEIL", image: "☀️", roman: "XVIIII", color: "#d4a017" },
  { name: "LE JUGEMENT", image: "🎺", roman: "XX", color: "#4e9258" },
  { name: "LE MONDE", image: "🌍", roman: "XXI", color: "#d4a017" },
  { name: "LE MAT", image: "🚶", roman: " ", color: "#990000" },
];

const RIDER_WAITE = [
  { name: "The Magician", image: "✨" },
  { name: "The High Priestess", image: "🌙" },
  { name: "The Empress", image: "🌿" },
  { name: "The Emperor", image: "🛡️" },
  { name: "The Hierophant", image: "🛐" },
  { name: "The Lovers", image: "🕊️" },
  { name: "Strength", image: "🦁" },
  { name: "The Star", image: "⭐" },
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
  
  // Voice states
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
    return () => {
      stopVoiceSession();
    };
  }, []);

  const drawCards = () => {
    let sourceDeck;
    if (deckType === 'MARSEILLE') sourceDeck = TAROT_MARSEILLE;
    else if (deckType === 'RIDER_WAITE') sourceDeck = RIDER_WAITE;
    else sourceDeck = ORACLE_CARDS;

    const shuffled = [...sourceDeck].sort(() => 0.5 - Math.random());
    setSelectedCards(shuffled.slice(0, 3));
    setIsReading(true);
    setTranscript('');
  };

  const startVoiceSession = async () => {
    if (sessionRef.current) return;
    setVoiceStatus('connecting');
    setTranscript('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const cardNames = selectedCards.map((c, i) => `${i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'} : ${c.name}`).join(', ');
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
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ 
                  media: { 
                    data: encodeAudio(new Uint8Array(int16.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  } 
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            // Trigger initial explanation
            sessionPromise.then((session) => {
              session.sendRealtimeInput({
                parts: [{ text: `Bonjour. Je viens de tirer 3 cartes du ${deckName}. Les cartes sont : ${cardNames}. Analyse-les pour moi avec ta sagesse de cartomancienne. Commence par m'accueillir avec bienveillance.` }]
              });
            });
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => prev + message.serverContent.outputTranscription.text);
            }

            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current && outputContextRef.current.state !== 'closed') {
              setVoiceStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
              
              const buffer = await decodeAudioData(
                decodeAudio(audioData),
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
          },
          onclose: () => stopVoiceSession(),
          onerror: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une cartomancienne experte à la voix jeune, claire et lumineuse. Ta diction est parfaite, chaque mot est articulé avec soin. Tu dois interpréter un tirage de 3 cartes (Passé, Présent, Futur). Sois poétique, bienveillante et utilise un vocabulaire ésotérique élégant. Tu ne parles qu'en Français.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Erreur voix:", err);
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
    <div className="space-y-16 py-6">
      <div className="flex justify-center flex-wrap gap-6 md:gap-10">
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('MARSEILLE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'MARSEILLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >TAROT DE MARSEILLE</button>
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('RIDER_WAITE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'RIDER_WAITE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >RIDER-WAITE</button>
        <button 
          disabled={isVoiceActive}
          onClick={() => { setDeckType('ORACLE'); setIsReading(false); stopVoiceSession(); }}
          className={`px-6 md:px-8 py-3 font-mystic tracking-widest transition-all rounded-sm border-2 ${deckType === 'ORACLE' ? 'bg-gold-bright text-purple-950 border-gold-bright shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-gold-muted/40 text-gold-muted hover:border-gold-bright'}`}
        >ORACLE MYSTIQUE</button>
      </div>

      {!isReading ? (
        <div className="text-center py-12">
          <div className="mb-12 flex justify-center gap-6 py-10 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div 
                key={i} 
                className={`w-32 h-52 card-back-pattern ${getDeckBackClass()} shadow-2xl transition-all duration-500 hover:-translate-y-6 hover:rotate-3 flex items-center justify-center`}
              >
                <span className="card-back-icon text-4xl">{deckType === 'MARSEILLE' ? '☀️' : deckType === 'RIDER_WAITE' ? '☸️' : '👁️'}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={drawCards}
            className="px-16 py-6 bg-gradient-to-b from-purple-900 to-black text-gold-bright font-mystic text-2xl tracking-[0.3em] border-2 border-gold-bright hover:scale-105 transition-all shadow-[0_0_40px_rgba(184,134,11,0.3)] uppercase"
          >
            Mélanger les Arcanes
          </button>
        </div>
      ) : (
        <div className="space-y-16 animate-in fade-in duration-1000">
          <div className="flex justify-center gap-10 md:gap-14 flex-wrap">
            {selectedCards.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="text-xs font-mystic uppercase tracking-[0.4em] text-gold-muted/60">{i === 0 ? 'Passé' : i === 1 ? 'Présent' : 'Futur'}</span>
                
                {deckType === 'MARSEILLE' ? (
                  <div className="w-56 h-96 card-marseille-authentic hover:-translate-y-4">
                    <div className="card-marseille-inner" style={{ borderColor: card.color }}>
                      <div className="card-marseille-accent-frame" style={{ borderColor: card.color }}>
                        <div className="card-marseille-header" style={{ color: card.color }}>{card.roman}</div>
                        <div className="card-marseille-illustration">
                          <span className="text-8xl drop-shadow-lg">{card.image}</span>
                        </div>
                        <div className="card-marseille-footer">
                          <div className="card-marseille-title">{card.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-56 h-88 bg-[#fdf6e3] p-1 border-4 border-gold-muted shadow-[0_20px_50px_rgba(0,0,0,0.7)] transform transition-transform hover:-translate-y-4 rounded-sm">
                    <div className="h-full w-full border-2 border-gold-muted/20 flex flex-col items-center justify-between p-4">
                        <div className="text-xs font-bold text-amber-900 opacity-40 uppercase tracking-tighter">
                          {deckType === 'ORACLE' ? 'Oracle des Destins' : 'Rider-Waite Smith'}
                        </div>
                        <span className="text-8xl drop-shadow-md my-6">{card.image}</span>
                        <h4 className="font-mystic text-amber-950 text-xl text-center leading-none border-t border-gold-muted/30 pt-4 w-full uppercase">{card.name}</h4>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
            {!isVoiceActive ? (
              <button 
                onClick={startVoiceSession}
                disabled={voiceStatus === 'connecting'}
                className="group flex flex-col items-center gap-4 bg-gold-bright/10 p-8 rounded-full border-2 border-gold-bright/30 hover:border-gold-bright transition-all"
              >
                <div className="w-20 h-20 bg-gold-bright rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="font-mystic text-gold-bright tracking-[0.2em] uppercase text-sm">Écouter la lecture de Cécile</span>
              </button>
            ) : (
              <div className="w-full space-y-8 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center bg-black/40 p-4 border border-gold-bright/20 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${voiceStatus === 'speaking' ? 'bg-green-500 animate-ping' : 'bg-gold-bright'}`}></div>
                    <span className="font-mystic text-xs text-gold-bright uppercase tracking-widest">Cécile interprète vos arcanes...</span>
                  </div>
                  <button onClick={stopVoiceSession} className="text-red-400 hover:text-red-500 font-mystic text-[10px] uppercase tracking-widest px-4 py-2 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-all">Interrompre la voyance</button>
                </div>

                <div className="parchment p-10 antique-border shadow-2xl relative min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar bg-[#fdf6e3]" ref={transcriptRef}>
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <span className="text-6xl">✒️</span>
                  </div>
                  <p className="font-serif italic text-2xl leading-relaxed text-amber-950 first-letter:text-5xl first-letter:font-mystic first-letter:mr-3 first-letter:float-left">
                    {transcript || "Cécile se concentre sur les fils de votre destin..."}
                  </p>
                </div>
              </div>
            )}

            <button 
              disabled={isVoiceActive}
              onClick={() => { setIsReading(false); stopVoiceSession(); }} 
              className="text-gold-muted hover:text-gold-bright font-mystic text-sm uppercase tracking-widest transition-colors flex items-center gap-3 mt-4 disabled:opacity-20"
            >
              <span className="text-xl">←</span> Purifier le jeu & recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotRoom;

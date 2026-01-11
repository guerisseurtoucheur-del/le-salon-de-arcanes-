
import React, { useState, useRef, useEffect } from 'react';
import { askCecileDeep, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { GoogleGenAI, Modality } from '@google/genai';

const CecileDeepRoom: React.FC<{ onBack: () => void }> = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Voice states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const responseRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Auto-start voice session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startVoiceSession(true); // true indicates it's an auto-start
    }, 500); // Small delay to ensure smooth transition
    
    return () => {
      clearTimeout(timer);
      stopVoiceSession();
    };
  }, []);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, isThinking]);

  const handleConsult = async () => {
    if (!query.trim() || isThinking) return;
    setIsThinking(true);
    setResponse('');
    try {
      const res = await askCecileDeep(query);
      setResponse(res);
    } catch (e) {
      setResponse("Le voile entre nos mondes est trop épais aujourd'hui. Retentez plus tard.");
    } finally {
      setIsThinking(false);
    }
  };

  const startVoiceSession = async (isInitialGreeting = false) => {
    if (sessionRef.current) return;
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
            setIsVoiceActive(true);
            setVoiceStatus('listening');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
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

            // Send initial greeting trigger if this is the start of the session
            if (isInitialGreeting) {
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  parts: [{ text: "Bonjour. Je viens d'entrer dans ton sanctuaire. Accueille-moi avec ta voix jeune et distincte, et demande-moi avec clarté : 'Qu'est-ce qui vous amène ici ?'" }]
                });
              });
            }
          },
          onmessage: async (message: any) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
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

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopVoiceSession(),
          onerror: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile. Tu as une voix jeune, fraîche, très claire et parfaitement articulée. Ta diction est distincte, sans être rapide. Tu es une guide spirituelle lumineuse. Parle avec bienveillance et une précision cristalline dans tes mots. Tu accueilles les visiteurs dans ton sanctuaire pour éclairer leur futur avec une intelligence vive et une voix mélodieuse.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Échec de l'initiation de la communion :", err);
      setVoiceStatus('idle');
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    setIsVoiceActive(false);
    setVoiceStatus('idle');
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 min-h-[80vh]">
      <div className="text-center space-y-4 animate-fade">
        <h2 className="text-5xl font-mystic text-gold-bright tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] leading-tight">Cécile éclaire votre Futur</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">L'Oracle entre en Méditation Profonde.</p>
      </div>

      {/* Spiritual Visualization */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <div className={`absolute inset-0 bg-purple-600/10 rounded-full blur-[100px] transition-all duration-1000 ${isThinking || voiceStatus === 'speaking' ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}`}></div>
        
        {/* Sacred Heart / Eye Symbol */}
        <div className={`relative z-10 w-48 h-48 bg-gradient-to-br from-purple-950 to-black border-4 border-gold-bright/20 rounded-full transition-all duration-1000 flex items-center justify-center ${isThinking || voiceStatus === 'speaking' ? 'animate-pulse border-gold-bright shadow-[0_0_80px_rgba(255,215,0,0.5)] scale-110' : ''}`}>
           <div className={`w-32 h-32 bg-black/60 border-2 border-gold-muted/10 rounded-full flex items-center justify-center`}>
              <span className={`text-7xl drop-shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-500 ${isThinking || voiceStatus === 'speaking' ? 'scale-125 opacity-100 rotate-12' : 'opacity-40'}`}>👁️</span>
           </div>
        </div>
        
        {/* Sacred Geometry Overlays */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`w-72 h-72 border border-gold-muted/10 rounded-full ${isThinking || isVoiceActive ? 'animate-spin' : ''}`} style={{ animationDuration: '20s' }}></div>
            <div className={`absolute w-64 h-64 border border-gold-muted/5 rounded-full ${isThinking || isVoiceActive ? 'animate-spin' : ''}`} style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8 z-20">
        <div className="relative group">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Confiez à Cécile vos questionnements les plus profonds..."
              className="w-full bg-black/80 border-2 border-gold-muted/30 p-8 rounded-3xl text-gold-bright text-2xl font-serif-elegant italic focus:outline-none focus:border-gold-bright transition-all placeholder:text-gold-muted/20 shadow-2xl min-h-[150px] resize-none pr-24"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleConsult()}
            />
            
            {/* Voice Toggle Button */}
            <button 
              onClick={isVoiceActive ? stopVoiceSession : () => startVoiceSession(false)}
              disabled={voiceStatus === 'connecting'}
              className={`absolute right-6 top-6 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 shadow-lg ${
                isVoiceActive 
                  ? 'bg-red-900/40 border-red-500 text-red-400 animate-pulse' 
                  : 'bg-gold-bright/10 border-gold-bright/40 text-gold-bright hover:bg-gold-bright/30'
              }`}
              title={isVoiceActive ? "Cesser la communion vocale" : "Parler à l'Oracle"}
            >
              {voiceStatus === 'connecting' ? (
                <div className="w-6 h-6 border-2 border-gold-bright/30 border-t-gold rounded-full animate-spin"></div>
              ) : isVoiceActive ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>

            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/0 via-gold-bright/10 to-purple-600/0 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>

        <button 
          onClick={handleConsult}
          disabled={!query.trim() || isThinking || isVoiceActive}
          className="w-full py-6 bg-gradient-to-r from-purple-950 via-purple-900 to-black border-2 border-gold-muted text-gold-bright font-mystic text-xl md:text-2xl tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_50px_rgba(59,7,100,0.5)] uppercase rounded-2xl px-4"
        >
          {isThinking ? 'Cécile sonde votre âme...' : isVoiceActive ? 'Parler, Cécile vous écoute et va vous répondre' : 'Invoquer la Sagesse'}
        </button>

        {/* Animated Voice/Thinking Indicators */}
        {(isThinking || isVoiceActive) && (
          <div className="p-10 bg-black/40 rounded-3xl border border-gold-muted/20 animate-pulse text-center">
            <p className="font-mystic text-gold-muted text-xl tracking-widest uppercase mb-4">
              {voiceStatus === 'speaking' ? "Cécile murmure ses vérités..." : 
               voiceStatus === 'listening' ? "L'Oracle écoute votre murmure..." :
               "L'Oracle traverse les strates du temps..."}
            </p>
            <div className="flex justify-center gap-4">
               <div className={`w-3 h-3 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-ping' : 'animate-bounce'}`}></div>
               <div className={`w-3 h-3 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-ping' : 'animate-bounce'} [animation-delay:0.2s]`}></div>
               <div className={`w-3 h-3 bg-gold-bright rounded-full ${voiceStatus === 'speaking' ? 'animate-ping' : 'animate-bounce'} [animation-delay:0.4s]`}></div>
            </div>
          </div>
        )}

        {response && (
          <div ref={responseRef} className="p-12 glass-mystic gold-border rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center gap-4 mb-8 border-b border-gold-muted/20 pb-4">
                <span className="text-3xl text-gold-bright">✨</span>
                <span className="font-mystic text-gold-bright text-sm uppercase tracking-[0.4em]">Murmure de la Sagesse de Cécile</span>
            </div>
            <div className="prose prose-invert max-w-none text-gold-bright/90 font-sensual text-4xl leading-relaxed italic text-shadow-lg">
                {response.split('\n').map((para, i) => (
                    <p key={i} className="mb-6">{para}</p>
                ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gold-muted/10 flex justify-end">
                <button 
                  onClick={() => { setQuery(''); setResponse(''); }}
                  className="text-gold-muted hover:text-gold-bright text-xs font-mystic uppercase tracking-widest transition-colors"
                >
                  Fermer la Vision
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CecileDeepRoom;

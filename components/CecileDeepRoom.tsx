
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

  useEffect(() => {
    return () => {
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

            if (isInitialGreeting) {
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  parts: [{ text: "Bonjour. Accueille-moi avec ta voix jeune et distincte, et demande-moi : 'Qu'est-ce qui vous amène ici ?'" }]
                });
              });
            }
          },
          onmessage: async (message: any) => {
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
          systemInstruction: "Tu es Cécile. Tu as une voix jeune, fraîche, très claire et parfaitement articulée. Ta diction est distincte. Tu es une guide spirituelle lumineuse.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Échec de l'initiation :", err);
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

  return (
    <div className="flex flex-col items-center gap-10 py-10 min-h-[80vh]">
      <div className="text-center space-y-4 animate-fade">
        <h2 className="text-5xl font-mystic text-gold-bright tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] leading-tight">Cécile éclaire votre Futur</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">L'Oracle entre en Méditation Profonde.</p>
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center">
        <div className={`absolute inset-0 bg-purple-600/10 rounded-full blur-[100px] transition-all duration-1000 ${isThinking || voiceStatus === 'speaking' ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}`}></div>
        <div className={`relative z-10 w-48 h-48 bg-gradient-to-br from-purple-950 to-black border-4 border-gold-bright/20 rounded-full flex items-center justify-center ${isThinking || voiceStatus === 'speaking' ? 'animate-pulse' : ''}`}>
           <span className="text-7xl">👁️</span>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-8 z-20">
        <div className="relative group">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Confiez à Cécile vos questionnements..."
              className="w-full bg-black/80 border-2 border-gold-muted/30 p-8 rounded-3xl text-gold-bright text-2xl font-serif-elegant italic focus:border-gold-bright transition-all min-h-[150px] resize-none pr-24"
            />
            <button 
              onClick={isVoiceActive ? stopVoiceSession : () => startVoiceSession(false)}
              disabled={voiceStatus === 'connecting'}
              className={`absolute right-6 top-6 w-16 h-16 rounded-full flex items-center justify-center border-2 ${isVoiceActive ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-gold-bright/10 border-gold-bright/40 text-gold-bright'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
        </div>

        <button 
          onClick={handleConsult}
          disabled={!query.trim() || isThinking || isVoiceActive}
          className="w-full py-6 bg-gradient-to-r from-purple-950 via-purple-900 to-black border-2 border-gold-muted text-gold-bright font-mystic text-2xl tracking-[0.2em] rounded-2xl"
        >
          {isThinking ? 'Sondage de l\'âme...' : 'Invoquer la Sagesse'}
        </button>

        {response && (
          <div ref={responseRef} className="p-12 glass-mystic gold-border rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,1)]">
            <div className="prose prose-invert max-w-none text-gold-bright/90 font-sensual text-4xl leading-relaxed italic">
                {response.split('\n').map((para, i) => <p key={i} className="mb-6">{para}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CecileDeepRoom;

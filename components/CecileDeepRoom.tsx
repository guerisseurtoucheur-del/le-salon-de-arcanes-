
import React, { useState, useRef, useEffect } from 'react';
import { askCecileDeep, encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';
import { GoogleGenAI, Modality } from '@google/genai';

const CecileDeepRoom: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    startVoiceSession(true);
    return () => stopVoiceSession();
  }, []);

  const resumeAudio = () => {
    if (outputContextRef.current?.state === 'suspended') {
      outputContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const handleTextSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    resumeAudio();
    if (!query.trim() || !sessionRef.current) return;

    const text = query;
    setQuery('');
    setTranscript(prev => [...prev, { role: 'user', text }]);
    
    try {
      sessionRef.current.sendRealtimeInput({
        parts: [{ text: text }]
      });
    } catch (err) {
      console.error('Failed to send text input:', err);
    }
  };

  const startVoiceSession = async (isInitialGreeting = false) => {
    if (sessionRef.current) {
      if (isInitialGreeting) {
         sessionRef.current.sendRealtimeInput({
          parts: [{ text: "Bonjour Cécile. Accueille-moi chaleureusement en français et dis-moi que je peux te parler ou t'écrire ce qui me tourmente aujourd'hui." }]
        });
      }
      return;
    }

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
              if (!audioContextRef.current || audioContextRef.current.state === 'closed' || !sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            if (isInitialGreeting) {
              sessionPromise.then(s => s.sendRealtimeInput({ parts: [{ text: "Bonjour Cécile. Accueille-moi chaleureusement en français et dis-moi que je peux te parler ou t'écrire ce qui me tourmente aujourd'hui." }] }));
            }
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') return [...prev.slice(0, -1), { role: 'model', text: last.text + text }];
                return [...prev, { role: 'model', text }];
              });
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text.trim().length > 2) {
                setTranscript(prev => {
                   const last = prev[prev.length - 1];
                   if (last && last.role === 'user' && !last.text.includes(text)) return [...prev.slice(0, -1), { role: 'user', text: last.text + " " + text }];
                   if (last && last.role === 'user') return prev;
                   return [...prev, { role: 'user', text }];
                });
              }
            }

            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data && outputContextRef.current && outputContextRef.current.state !== 'closed') {
                  setVoiceStatus('speaking');
                  resumeAudio();
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                  const buffer = await decodeAudioData(decodeAudio(part.inlineData.data), outputContextRef.current, 24000, 1);
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
          },
          onclose: () => stopVoiceSession(),
          onerror: () => stopVoiceSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, une guide spirituelle lumineuse. RÉPONDS TOUJOURS EN FRANÇAIS. Ta voix est jeune, chaleureuse et très claire. Tu es proactive : dès que l'utilisateur entre ou t'écrit, réponds avec empathie et sagesse. Tu es ici pour l'aider à naviguer dans les eaux de son destin.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setVoiceStatus('idle');
    }
  };

  const stopVoiceSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputContextRef.current) outputContextRef.current.close().catch(() => {});
    setIsVoiceActive(false);
    setVoiceStatus('idle');
  };

  return (
    <div className="flex flex-col items-center gap-10 py-6 min-h-[85vh] relative" onClick={resumeAudio}>
      <div className="text-center space-y-4 animate-fade">
        <h2 className="text-4xl md:text-5xl font-mystic text-gold-bright tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] leading-tight">Le Miroir des Visions</h2>
        <p className="text-gold-muted font-sensual text-3xl italic">Confiez vos secrets à Cécile, par la voix ou la plume.</p>
      </div>

      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <div className={`absolute inset-0 bg-purple-600/10 rounded-full blur-[80px] transition-all duration-1000 ${voiceStatus === 'speaking' ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}`}></div>
        <div className={`relative z-10 w-40 h-40 md:w-48 md:h-48 bg-gradient-to-br from-purple-950 to-black border-4 border-gold-bright/20 rounded-full flex items-center justify-center transition-all duration-500 ${voiceStatus === 'speaking' ? 'animate-pulse border-gold-bright shadow-[0_0_40px_rgba(255,215,0,0.4)]' : ''}`}>
           <span className={`text-6xl md:text-7xl transition-transform duration-700 ${voiceStatus === 'speaking' ? 'scale-110 rotate-12' : ''}`}>👁️</span>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 z-20">
        <div className="flex flex-col h-[400px] md:h-[500px]">
          <div className="flex-1 parchment rounded-xl p-6 antique-border shadow-2xl overflow-y-auto custom-scrollbar bg-[#fdf6e3]">
            <div className="space-y-6 font-serif italic text-lg text-amber-950">
              {transcript.length === 0 && <p className="text-center opacity-40 mt-20">L'Oracle attend votre vérité...</p>}
              {transcript.map((line, i) => (
                <div key={i} className={`p-4 border-l-4 transition-all animate-in fade-in duration-500 ${line.role === 'user' ? 'border-purple-900/10 text-purple-900/60 ml-6 bg-black/5 rounded-r italic' : 'border-gold text-amber-950 font-bold bg-gold/5 rounded-r'}`}>
                  <span className="text-xs uppercase font-mystic block mb-1 opacity-50 tracking-widest">{line.role === 'user' ? 'Vous' : 'Cécile'}</span>
                  {line.text}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative group">
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleTextSend()}
                placeholder="Écrivez ici ou activez le micro..."
                className="w-full bg-black/80 border-2 border-gold-muted/30 p-6 rounded-3xl text-gold-bright text-xl font-serif-elegant italic focus:border-gold-bright transition-all min-h-[150px] resize-none pr-32 shadow-2xl"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                <button onClick={handleTextSend} disabled={!query.trim()} className="w-12 h-12 rounded-full bg-gold-bright/10 border border-gold-bright/40 text-gold-bright flex items-center justify-center hover:bg-gold-bright hover:text-black transition-all disabled:opacity-20"><span className="text-xl">🖋️</span></button>
                <button 
                  onClick={() => { resumeAudio(); isVoiceActive ? stopVoiceSession() : startVoiceSession(false); }}
                  disabled={voiceStatus === 'connecting'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${isVoiceActive ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-gold-bright/10 border-gold-bright/40 text-gold-bright hover:scale-110'}`}
                >
                  {voiceStatus === 'connecting' ? <div className="w-4 h-4 border-2 border-t-gold-bright rounded-full animate-spin"></div> : <span className="text-xl">🎙️</span>}
                </button>
              </div>
          </div>
          <div className="p-6 glass-mystic rounded-2xl border border-gold-muted/20">
             <p className="text-[10px] text-center font-mystic text-gold-muted uppercase tracking-[0.3em]">Cécile vous répondra d'une voix mélodieuse dès que vous aurez parlé ou écrit.</p>
          </div>
        </div>
      </div>

      <button onClick={() => { stopVoiceSession(); onBack(); }} className="fixed bottom-10 left-10 px-6 py-2 border border-gold-muted/30 text-gold-muted hover:text-gold-bright transition-all font-mystic text-[10px] uppercase tracking-widest z-[50]">Quitter les Visions</button>
    </div>
  );
};

export default CecileDeepRoom;

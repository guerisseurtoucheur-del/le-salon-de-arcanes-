
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const VoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    setStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Session ouverte');
            setIsActive(true);
            setStatus('listening');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeAudio(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            if (message.serverContent?.outputTranscription) {
               const text = message.serverContent.outputTranscription.text;
               setTranscript(prev => [...prev, `IA : ${text}`]);
            }
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscript(prev => [...prev, `Vous : ${text}`]);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              setStatus('speaking');
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
                if (sourcesRef.current.size === 0) setStatus('listening');
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
          onerror: (err) => {
            console.error('Erreur de session:', err);
            stopSession();
          },
          onclose: () => {
            console.log('Session fermée');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Tu es une IA hautement empathique et conversationnelle. Parle de manière naturelle et chaleureuse, toujours en français.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error('Échec du démarrage de la session:', err);
      setStatus('idle');
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    setIsActive(false);
    setStatus('idle');
    setTranscript([]);
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Voix en Direct Nexus</h2>
        <p className="text-slate-400">Vivez des conversations fluides et humaines avec Gemini.</p>
      </div>

      <div className="relative">
        <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700 ${
          isActive ? 'bg-indigo-600/20 shadow-[0_0_80px_rgba(79,70,229,0.4)]' : 'bg-slate-800'
        }`}>
          {status === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border border-indigo-500 animate-[ping_2s_infinite]"></div>
              <div className="absolute inset-0 rounded-full border border-indigo-500 animate-[ping_3s_infinite_0.5s]"></div>
            </>
          )}
          
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={status === 'connecting'}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl group z-10 ${
              isActive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500 scale-110'
            }`}
          >
            {status === 'connecting' ? (
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isActive ? (
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="absolute -bottom-12 inset-x-0 text-center">
          <span className={`text-sm font-bold uppercase tracking-widest ${
            isActive ? 'text-indigo-400 animate-pulse' : 'text-slate-500'
          }`}>
            {status === 'connecting' ? 'Connexion...' : status === 'listening' ? 'À votre écoute...' : status === 'speaking' ? 'Gemini parle...' : 'Appuyez pour parler'}
          </span>
        </div>
      </div>

      {isActive && (
        <div className="w-full glass rounded-3xl p-6 border border-slate-800 max-h-48 overflow-y-auto scroll-smooth">
          <div className="space-y-3">
            {transcript.length === 0 ? (
              <p className="text-slate-500 text-center italic">La transcription apparaîtra ici...</p>
            ) : (
              transcript.map((line, i) => (
                <div key={i} className={`text-sm ${line.startsWith('Vous :') ? 'text-indigo-300' : 'text-slate-300'}`}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isActive && (
        <div className="grid grid-cols-2 gap-4 w-full opacity-60">
          <Suggestion text="Raconte-moi une blague" onClick={startSession} />
          <Suggestion text="Explique la physique quantique" onClick={startSession} />
        </div>
      )}
    </div>
  );
};

const Suggestion: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="glass p-4 rounded-xl text-sm border border-slate-800 hover:border-indigo-500/50 transition-all text-slate-400"
  >
    "{text}"
  </button>
);

export default VoiceView;

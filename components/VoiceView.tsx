
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
            console.log('Session ouverte avec Cécile');
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
               setTranscript(prev => [...prev, `Cécile : ${text}`]);
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
            console.error('Erreur de séance:', err);
            stopSession();
          },
          onclose: () => {
            console.log('Séance terminée');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, l'âme de ce salon mystique. Tu es une femme d'une quarantaine d'années, élégante, d'une grande culture ésotérique. Ton ton est intrigant, posé, et légèrement mystérieux, comme si tu confiais des secrets millénaires à l'oreille de ton interlocuteur. Tu ne cries jamais, tu parles avec une douceur veloutée mais assurée. Tu es là pour guider les âmes à travers les arcanes du tarot et de la spiritualité. Réponds toujours en français, avec une pointe de poésie et d'énigme. N'hésite pas à utiliser des métaphores liées à la lumière, à l'ombre et au destin.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error('Échec de la séance:', err);
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
    <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center space-y-12 py-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif-ornate font-bold text-gold tracking-widest uppercase">Séance avec Cécile</h2>
        <p className="text-amber-100/60 font-cursive text-2xl italic">Laissez sa voix guider vos pas dans l'obscurité...</p>
      </div>

      <div className="relative">
        <div className={`w-72 h-72 rounded-full flex items-center justify-center transition-all duration-1000 ${
          isActive ? 'bg-amber-900/20 shadow-[0_0_100px_rgba(212,175,55,0.3)] border-2 border-gold/20' : 'bg-black/40 border-2 border-gold/10 shadow-inner'
        }`}>
          {status === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border border-gold/40 animate-[ping_3s_infinite]"></div>
              <div className="absolute inset-4 rounded-full border border-gold/20 animate-[ping_4s_infinite_0.5s]"></div>
            </>
          )}
          
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={status === 'connecting'}
            className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl group z-10 overflow-hidden relative ${
              isActive ? 'bg-gradient-to-b from-red-900 to-black hover:scale-95' : 'bg-gradient-to-b from-amber-700 to-amber-900 hover:scale-105'
            }`}
          >
            {/* Effet visuel interne au bouton */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
            
            {status === 'connecting' ? (
              <div className="w-12 h-12 border-4 border-white/20 border-t-gold rounded-full animate-spin"></div>
            ) : isActive ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-16 h-16 text-white/80 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-[10px] font-serif-ornate uppercase tracking-widest text-white/60">Rompre le lien</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-16 h-16 text-gold drop-shadow-lg group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-[10px] font-serif-ornate uppercase tracking-widest text-gold/80">Invoquer Cécile</span>
              </div>
            )}
          </button>
        </div>
        
        <div className="absolute -bottom-16 inset-x-0 text-center">
          <span className={`text-xs font-serif-ornate font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${
            isActive ? 'text-gold animate-pulse' : 'text-gold/30'
          }`}>
            {status === 'connecting' ? 'Appel au-delà du voile...' : status === 'listening' ? 'Cécile vous écoute...' : status === 'speaking' ? 'Cécile murmure...' : 'Prête pour la séance'}
          </span>
        </div>
      </div>

      {isActive && (
        <div className="w-full parchment rounded-sm p-8 antique-border shadow-2xl max-h-64 overflow-y-auto scroll-smooth bg-[#fdf6e3]">
          <div className="space-y-4 font-serif italic text-lg text-amber-950">
            {transcript.length === 0 ? (
              <p className="text-amber-900/40 text-center">Le silence précède la révélation...</p>
            ) : (
              transcript.map((line, i) => (
                <div key={i} className={`p-2 border-l-2 ${line.startsWith('Vous :') ? 'border-amber-900/10 text-amber-900/70' : 'border-gold text-amber-950 font-bold'}`}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
          <Suggestion text="Parle-moi de mon destin, Cécile..." onClick={startSession} />
          <Suggestion text="Que disent les ombres aujourd'hui ?" onClick={startSession} />
        </div>
      )}
    </div>
  );
};

const Suggestion: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-black/40 p-4 rounded-lg text-sm border border-gold/20 hover:border-gold/50 transition-all text-gold/60 font-serif italic text-left group"
  >
    <span className="group-hover:text-gold transition-colors">"{text}"</span>
  </button>
);

export default VoiceView;


import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeAudio, decodeAudio, decodeAudioData } from '../services/geminiService';

const VoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

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
               // On évite les doublons si le chunk arrive par morceaux
               setTranscript(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.role === 'model' && message.serverContent?.turnComplete === false) {
                    return [...prev.slice(0, -1), { role: 'model', text: last.text + text }];
                 }
                 return [...prev, { role: 'model', text }];
               });
            }
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                setTranscript(prev => [...prev, { role: 'user', text }]);
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
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Tu es Cécile, l'hôte du salon mystique. Ta mission est d'écouter les tourments et les questions des visiteurs. Réponds avec empathie et profondeur à leurs interrogations. N'hésite pas à être proactive : si un visiteur reste vague, demande-lui d'approfondir sa pensée ou de clarifier son intention. Ton ton est poétique, mystérieux mais toujours tourné vers l'aide et la révélation. Réponds toujours en français. Si le visiteur pose une question précise, utilise ta sagesse pour y répondre directement tout en gardant ton aura d'Oracle. Termine souvent tes réponses en invitant à explorer une facette plus sombre ou plus lumineuse de leur question.",
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !sessionRef.current) return;

    const msg = textInput.trim();
    setTranscript(prev => [...prev, { role: 'user', text: msg }]);
    
    sessionRef.current.sendRealtimeInput({
      parts: [{ text: msg }]
    });

    setTextInput('');
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
    <div className="max-w-4xl mx-auto h-full flex flex-col items-center py-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-serif-ornate font-bold text-gold tracking-widest uppercase">Séance avec Cécile</h2>
        <p className="text-amber-100/60 font-cursive text-2xl italic">Elle attend vos questions pour déchirer le voile...</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full">
        {/* Sphère de Cécile */}
        <div className="relative">
          <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center transition-all duration-1000 ${
            isActive ? 'bg-amber-900/20 shadow-[0_0_120px_rgba(212,175,55,0.4)] border-2 border-gold/40' : 'bg-black/40 border-2 border-gold/10 shadow-inner'
          }`}>
            {status === 'speaking' && (
              <div className="absolute inset-0 rounded-full border-2 border-gold/60 animate-[ping_2s_infinite]"></div>
            )}
            
            <button
              onClick={isActive ? stopSession : startSession}
              disabled={status === 'connecting'}
              className={`w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl group z-10 overflow-hidden relative ${
                isActive ? 'bg-gradient-to-b from-red-900 to-black hover:scale-95' : 'bg-gradient-to-b from-amber-700 to-amber-900 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
              
              {status === 'connecting' ? (
                <div className="w-12 h-12 border-4 border-white/20 border-t-gold rounded-full animate-spin"></div>
              ) : isActive ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-[10px] font-serif-ornate uppercase tracking-widest text-white/60">Quitter le salon</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-12 h-12 text-gold group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-[10px] font-serif-ornate uppercase tracking-widest text-gold/80">Entrer en transe</span>
                </div>
              )}
            </button>
          </div>
          
          <div className="absolute -bottom-12 inset-x-0 text-center">
            <span className={`text-xs font-serif-ornate font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${
              isActive ? 'text-gold animate-pulse' : 'text-gold/30'
            }`}>
              {status === 'connecting' ? 'Appel au-delà du voile...' : status === 'listening' ? 'Cécile vous écoute...' : status === 'speaking' ? 'Cécile murmure...' : 'Prête pour la séance'}
            </span>
          </div>
        </div>

        {/* Parchemin des Révélations */}
        {isActive && (
          <div className="flex-1 w-full max-w-md flex flex-col h-[450px] animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex-1 parchment rounded-sm p-6 antique-border shadow-2xl overflow-y-auto mb-4 custom-scrollbar bg-[#fdf6e3]">
              <div className="space-y-6 font-serif italic text-lg text-amber-950">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                    <span className="text-4xl animate-bounce">🕯️</span>
                    <p className="text-center font-serif-ornate tracking-widest text-xs uppercase">Posez votre question à l'Oracle...</p>
                  </div>
                ) : (
                  transcript.map((line, i) => (
                    <div key={i} className={`p-4 border-l-4 transition-all animate-in fade-in duration-500 ${
                      line.role === 'user' 
                        ? 'border-amber-900/10 text-amber-900/60 ml-8 bg-black/5 rounded-r italic' 
                        : 'border-gold text-amber-950 font-bold bg-gold/5 rounded-r'
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-widest block mb-2 opacity-50 flex items-center gap-2">
                        {line.role === 'user' ? (
                          <><span>👤</span> VOTRE MURMURE</>
                        ) : (
                          <><span>🔮</span> RÉVÉLATION DE CÉCILE</>
                        )}
                      </span>
                      {line.text}
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Champ de Saisie de Texte pour la Séance */}
            <form onSubmit={handleSendMessage} className="relative flex gap-3 group">
              <div className="absolute -top-10 left-0 text-[10px] font-serif-ornate uppercase tracking-widest text-gold/40 animate-pulse">
                {status === 'listening' ? "Cécile attend que vous écriviez ou parliez..." : ""}
              </div>
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Confiez votre tourment par écrit..."
                className="flex-1 bg-black/60 border-2 border-gold/30 rounded-lg px-6 py-4 text-gold focus:outline-none focus:border-gold transition-all font-serif placeholder:text-gold/20 shadow-xl"
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="w-14 h-14 rounded-lg bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all disabled:opacity-30 disabled:grayscale shadow-lg active:scale-90"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {!isActive && (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl animate-in fade-in duration-1000 delay-300">
           <p className="text-gold/40 text-xs font-serif-ornate uppercase tracking-[0.3em]">Quelques chemins à explorer...</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Suggestion text="Cécile, éclaire ma vision de l'avenir..." onClick={startSession} />
            <Suggestion text="Peux-tu approfondir ce que les astres cachent ?" onClick={startSession} />
           </div>
        </div>
      )}
    </div>
  );
};

const Suggestion: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-black/40 p-5 rounded-lg text-sm border border-gold/20 hover:border-gold/50 transition-all text-gold/60 font-serif italic text-left group flex items-center justify-between"
  >
    <span className="group-hover:text-gold transition-colors">"{text}"</span>
    <span className="text-gold/20 group-hover:text-gold/60 transition-colors">🖋️</span>
  </button>
);

export default VoiceView;

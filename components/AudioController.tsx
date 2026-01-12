
import React, { useEffect, useRef, useState } from 'react';
import { ViewType, AUDIO_THEMES } from '../types';

interface AudioControllerProps {
  currentView: ViewType;
}

const AudioController: React.FC<AudioControllerProps> = ({ currentView }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const safePlay = async () => {
    if (!audioRef.current) return;
    try {
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Erreur de lecture:", err);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      setIsLoading(true);
      audioRef.current.src = AUDIO_THEMES[currentView];
      await safePlay();
      
      // Fade in
      let v = 0;
      const interval = setInterval(() => {
        v += 0.05;
        if (v >= volume) {
          if (audioRef.current) audioRef.current.volume = volume;
          clearInterval(interval);
        } else {
          if (audioRef.current) audioRef.current.volume = v;
        }
      }, 50);
      
      setIsPlaying(true);
      setIsLoading(false);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Changement de source avec protection contre l'interruption
  useEffect(() => {
    const updateSource = async () => {
      if (!audioRef.current || !isPlaying) return;
      
      const newSrc = AUDIO_THEMES[currentView];
      if (audioRef.current.src === newSrc) return;

      setIsLoading(true);

      // Si une lecture est en cours, on attend qu'elle soit stable avant de changer
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch {}
      }

      // Fondu rapide vers le nouveau son
      audioRef.current.src = newSrc;
      await safePlay();
      audioRef.current.volume = volume;
      setIsLoading(false);
    };

    updateSource();
  }, [currentView, isPlaying]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.volume = volume;
    }
  }, [volume, isPlaying]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3">
      {isPlaying && (
        <div className="flex flex-col gap-1 items-end animate-in slide-in-from-right-4">
          <span className="text-[10px] font-mystic text-gold-bright/60 uppercase tracking-widest mr-2 drop-shadow-md">Harmonie</span>
          <input 
            type="range" min="0" max="1" step="0.01" value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-gold-bright bg-black/60 rounded-full h-1 appearance-none cursor-pointer border border-gold-muted/20"
          />
        </div>
      )}
      
      <button 
        onClick={togglePlay}
        disabled={isLoading && !isPlaying}
        className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
          isPlaying 
            ? 'bg-gold-bright/10 text-gold-bright border-gold-bright shadow-[0_0_30px_rgba(255,215,0,0.4)]' 
            : 'bg-black/90 text-gold-muted border-gold-muted/40 hover:border-gold-bright'
        }`}
      >
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-gold-bright/20 border-t-gold-bright rounded-full animate-spin"></div>
        ) : isPlaying ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        )}
        {!isPlaying && <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-bright rounded-full animate-ping"></div>}
      </button>
    </div>
  );
};

export default AudioController;

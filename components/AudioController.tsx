
import React, { useEffect, useState, useRef } from 'react';
import { ViewType, AUDIO_THEMES } from '../types';

interface AudioControllerProps {
  currentView: ViewType;
  sharedAudio: HTMLAudioElement | null;
}

const AudioController: React.FC<AudioControllerProps> = ({ currentView, sharedAudio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioStartedRef = useRef(false);

  // Activation automatique une fois que l'audio partagé est disponible
  useEffect(() => {
    if (sharedAudio && !audioStartedRef.current) {
      startPlayback();
    }
  }, [sharedAudio]);

  const startPlayback = async () => {
    if (!sharedAudio) return;
    setIsLoading(true);
    
    try {
      // S'assurer que le volume est à 0 pour le fondu
      sharedAudio.volume = 0;
      const playPromise = sharedAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        audioStartedRef.current = true;
        
        // Fondu d'entrée doux (Fade-in)
        let v = 0;
        const interval = setInterval(() => {
          v += 0.02;
          if (v >= volume) {
            sharedAudio.volume = volume;
            clearInterval(interval);
          } else {
            sharedAudio.volume = v;
          }
        }, 50);
      }
    } catch (err) {
      console.warn("Échec lecture d'ambiance automatique. L'utilisateur doit cliquer sur Play.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!sharedAudio) return;

    if (!isPlaying) {
      try {
        await sharedAudio.play();
        sharedAudio.volume = volume;
        setIsPlaying(true);
        audioStartedRef.current = true;
      } catch (e) {
        console.error("Erreur manuelle Play:", e);
      }
    } else {
      sharedAudio.pause();
      setIsPlaying(false);
    }
  };

  // Changement de pièce (Thème musical)
  useEffect(() => {
    const updateTheme = async () => {
      if (!sharedAudio || !audioStartedRef.current || !isPlaying) return;
      
      const nextSrc = AUDIO_THEMES[currentView];
      if (sharedAudio.src.includes(nextSrc)) return;

      setIsLoading(true);
      try {
        sharedAudio.pause();
        sharedAudio.src = nextSrc;
        sharedAudio.load();
        await sharedAudio.play();
        sharedAudio.volume = volume;
      } catch (e) {
        console.error("Erreur changement de thème musical:", e);
      } finally {
        setIsLoading(false);
      }
    };

    updateTheme();
  }, [currentView, isPlaying, sharedAudio, volume]);

  useEffect(() => {
    if (sharedAudio && isPlaying) {
      sharedAudio.volume = volume;
    }
  }, [volume, isPlaying, sharedAudio]);

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
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
          isPlaying 
            ? 'bg-gold-bright/10 text-gold-bright border-gold-bright shadow-[0_0_30px_rgba(255,215,0,0.4)]' 
            : 'bg-black/90 text-gold-muted border-gold-muted/40 hover:border-gold-bright hover:scale-110'
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
        {!isPlaying && !isLoading && <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-bright rounded-full animate-ping"></div>}
      </button>
    </div>
  );
};

export default AudioController;

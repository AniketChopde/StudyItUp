import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { MotionStage } from '../animation/MotionStage';
import type { MotionData } from '../animation/motionTypes';
import apiClient from '../../api/client';

interface MotionVideoPlayerProps {
  topic: string;
  onClose?: () => void;
}

export default function MotionVideoPlayer({
  topic
}: MotionVideoPlayerProps) {
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const [titleVisible, setTitleVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());

  // Fetch Motion Script + Pre-fetch all audio
  const fetchMotionData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/content/visualize?topic=${encodeURIComponent(topic)}`);
      const data = res.data;
      setMotionData(data);
      setLoading(false); // Show UI immediately

      // Pre-fetch all stage audio in background
      if (data?.stages && Array.isArray(data.stages)) {
        const audioPromises = data.stages.map(async (stage: any, i: number) => {
          try {
            const ttsRes = await apiClient.post('/voice/tts', { text: stage.narration });
            if (ttsRes.data.audio_base64) {
              audioCacheRef.current.set(i, `data:audio/wav;base64,${ttsRes.data.audio_base64}`);
            }
          } catch (err) {
            console.warn(`Pre-fetch audio failed for stage ${i}`, err);
          }
        });
        await Promise.all(audioPromises);
      }
    } catch (err) {
      console.error('Failed to fetch motion data:', err);
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    fetchMotionData();
  }, [fetchMotionData]);

  // Hide title after 4 seconds of playing
  useEffect(() => {
    if (isPlaying && titleVisible) {
      const timeout = setTimeout(() => setTitleVisible(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, titleVisible]);

  // Reset playback when new data arrives
  useEffect(() => {
    if (motionData) {
      setCurrentTime(0);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setTitleVisible(true);
    }
  }, [motionData]);

  // Total Duration
  const totalDuration = useMemo(() => {
    if (!motionData?.stages || !Array.isArray(motionData.stages)) return 0;
    const dur = motionData.stages.reduce((acc, stage) => acc + (Number(stage.duration) || 10), 0);
    console.log('MotionVideo: Calculated total duration:', dur);
    return dur;
  }, [motionData]);

  // Timer
  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) return;
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.1;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Auto-Advance Stages
  useEffect(() => {
    if (!motionData?.stages || !isPlaying) return;
    
    let accumulated = 0;
    for (let i = 0; i < motionData.stages.length; i++) {
      const stageDur = Number(motionData.stages[i].duration) || 10;
      accumulated += stageDur;
      
      if (currentTime < accumulated) {
        if (currentStepIndex !== i) {
          console.log(`MotionVideo: Advancing to stage ${i}`);
          setCurrentStepIndex(i);
          playVoice(i); 
        }
        break;
      }
    }
  }, [currentTime, motionData, isPlaying, currentStepIndex]);

  // Play audio from cache (instant)
  const playVoice = useCallback((index: number) => {
    if (!audioRef.current) return;
    
    try {
      // Stop any currently playing audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      const cachedSrc = audioCacheRef.current.get(index);
      if (cachedSrc) {
        audioRef.current.src = cachedSrc;
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(err => {
          if (err.name !== 'AbortError') console.warn('Voice play failed:', err);
        });
      }
    } catch (err) {
      console.error('playVoice error:', err);
    }
  }, [isMuted]);

  const handleTogglePlay = () => {
    if (!audioRef.current || totalDuration <= 0) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If finished, restart from beginning
      if (currentTime >= totalDuration - 0.1) {
        setCurrentTime(0);
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
      setTitleVisible(true);
      
      // Sync audio if starting
      if (currentTime === 0 || currentTime >= totalDuration - 0.1) {
        playVoice(0);
      } else {
        // Resume current stage audio
        playVoice(currentStepIndex);
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (totalDuration <= 0) return;
    const seekTime = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(seekTime);
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Find and set the correct stage for this time
    if (motionData?.stages) {
      let accumulated = 0;
      for (let i = 0; i < motionData.stages.length; i++) {
        accumulated += Number(motionData.stages[i].duration) || 10;
        if (seekTime < accumulated) {
          if (currentStepIndex !== i) {
            setCurrentStepIndex(i);
          }
          if (isPlaying) playVoice(i);
          break;
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading State
  if (loading || !motionData) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f23]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full mb-6"
      />
      <span className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400/60 animate-pulse">
        Generating Animation...
      </span>
    </div>
  );

  return (
    <div className="w-full h-full relative bg-[#0f0f23] overflow-hidden group motion-video-container">
      {/* Main Animation Stage */}
      <div className="absolute inset-0 z-10">
        <MotionStage 
          currentStage={motionData.stages[currentStepIndex]} 
          theme="manim"
          topic={topic}
        />
      </div>

      <audio ref={audioRef} className="hidden" />

      {/* === CINEMATIC TITLE (appears then fades) === */}
      <AnimatePresence>
        {titleVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="absolute top-10 left-10 z-30 pointer-events-none max-w-lg"
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="h-[3px] bg-cyan-400 rounded-full mb-4 shadow-[0_0_10px_rgba(88,196,221,0.8)]"
            />
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              {motionData.title}
            </h1>
            <p className="text-sm text-cyan-400/50 font-mono mt-2 uppercase tracking-widest">
              NexusLearn • AI Animation
            </p>
          </motion.div>
        )}
      </AnimatePresence>


      {/* === PLAYER CONTROLS (minimal: play + speaker) === */}
      <div className={`absolute bottom-0 inset-x-0 z-[60] pb-3 px-6 transition-opacity duration-700 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        
        {/* Progress Bar (thin) */}
        <div className="relative h-1 group/progress cursor-pointer mb-2">
          <div className="absolute inset-0 bg-white/10 rounded-full" />
          <motion.div 
            className="absolute inset-y-0 left-0 bg-cyan-400 rounded-full"
            style={{ 
              width: `${(currentTime / totalDuration) * 100}%`,
              boxShadow: '0 0 6px #58C4DD66' 
            }}
          />
          <input 
            type="range" min="0" max={totalDuration} step="0.1" value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Buttons: Play + Speaker only */}
        <div className="flex items-center gap-4 text-white/80">
          <Button variant="ghost" size="icon" onClick={handleTogglePlay} className="h-8 w-8 text-white hover:bg-white/10 rounded-full transition-all hover:scale-110">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-0.5" />}
          </Button>

          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (audioRef.current) audioRef.current.muted = !isMuted;
            }}
            className="p-1 rounded-full hover:bg-white/10 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-white/40 hover:text-white/70" />}
          </button>
          <span className="text-[11px] font-mono text-white/40 tabular-nums">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}

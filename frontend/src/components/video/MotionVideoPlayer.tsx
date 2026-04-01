import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionStage } from '../animation/MotionStage';
import type { MotionData } from '../animation/motionTypes';
import apiClient from '../../api/client';

interface MotionVideoPlayerProps {
  topic: string;
  onClose?: () => void;
}

export default function MotionVideoPlayer({ topic }: MotionVideoPlayerProps) {
  const [motionData, setMotionData] = useState<MotionData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());

  const getAudioDuration = async (base64Audio: string): Promise<number> => {
    try {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
      if (audioContext.state !== 'closed') audioContext.close();
      return audioBuffer.duration;
    } catch {
      return 10;
    }
  };

  const fetchMotionData = useCallback(async () => {
    setLoading(true);
    setIsSyncing(false);
    try {
      const res = await apiClient.get(`/content/visualize?topic=${encodeURIComponent(topic)}`);
      const data = res.data;
      setMotionData(data);
      setLoading(false);

      if (data?.stages && Array.isArray(data.stages)) {
        setIsSyncing(true);
        const updatedStages = [...data.stages];
        const audioPromises = data.stages.map(async (stage: any, i: number) => {
          try {
            const ttsRes = await apiClient.post('/voice/tts', { text: stage.narration });
            if (ttsRes.data.audio_base64) {
              const dataUri = `data:audio/wav;base64,${ttsRes.data.audio_base64}`;
              audioCacheRef.current.set(i, dataUri);
              const realDur = await getAudioDuration(ttsRes.data.audio_base64);
              updatedStages[i] = { ...updatedStages[i], duration: realDur };
            }
          } catch (err) {
            console.warn(`Sync failed for stage ${i}`, err);
          }
        });
        await Promise.all(audioPromises);
        setMotionData(prev => prev ? { ...prev, stages: updatedStages } : null);
        setIsSyncing(false);
      }
    } catch (err) {
      console.error('Failed to fetch motion data:', err);
      setLoading(false);
      setIsSyncing(false);
    }
  }, [topic]);

  useEffect(() => { fetchMotionData(); }, [fetchMotionData]);

  useEffect(() => {
    if (motionData && !isSyncing && currentTime === 0) {
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  }, [motionData?.title, isSyncing]);

  const totalDuration = useMemo(() => {
    if (!motionData?.stages || !Array.isArray(motionData.stages)) return 0;
    return motionData.stages.reduce((acc, stage) => acc + (Number(stage.duration) || 10), 0);
  }, [motionData]);

  useEffect(() => {
    if (!isPlaying || totalDuration <= 0 || isSyncing) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = Math.min(prev + 0.1, totalDuration);
        if (next >= totalDuration) { setIsPlaying(false); return totalDuration; }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, isSyncing]);

  useEffect(() => {
    if (!motionData?.stages || !isPlaying || isSyncing) return;
    let accumulated = 0;
    for (let i = 0; i < motionData.stages.length; i++) {
      const stageDur = Number(motionData.stages[i].duration) || 10;
      accumulated += stageDur;
      if (currentTime < accumulated - 0.05) {
        if (currentStepIndex !== i) {
          setCurrentStepIndex(i);
          playVoice(i);
        }
        break;
      }
    }
  }, [currentTime, motionData, isPlaying, currentStepIndex, isSyncing]);

  const playVoice = useCallback((index: number) => {
    if (!audioRef.current) return;
    try {
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
      if (currentTime >= totalDuration - 0.1) {
        setCurrentTime(0);
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
      if (currentTime === 0 || currentTime >= totalDuration - 0.1) playVoice(0);
      else playVoice(currentStepIndex);
    }
  };

  const handleSeek = (newTime: number) => {
    if (totalDuration <= 0) return;
    const seekTime = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(seekTime);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (motionData?.stages) {
      let accumulated = 0;
      for (let i = 0; i < motionData.stages.length; i++) {
        accumulated += Number(motionData.stages[i].duration) || 10;
        if (seekTime < accumulated) {
          if (currentStepIndex !== i) setCurrentStepIndex(i);
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

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // ── Loading State ──────────────────────────────────────────────
  if (loading || !motionData) return (
    <div className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #FFFFFF 0%, #F5F7FF 100%)' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        className="w-12 h-12 rounded-full mb-5"
        style={{ border: '3px solid #E0E7FF', borderTopColor: '#6366F1' }}
      />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Generating Animation...</p>
      <p className="text-xs text-slate-400 mt-1">{topic}</p>
    </div>
  );

  // ── Syncing Overlay ────────────────────────────────────────────
  const SyncingOverlay = (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex flex-col items-center justify-center pointer-events-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-44 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366F1, #A855F7)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Preparing Audio...
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Main Render ────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#F8F9FF' }}>

      {/* Main Animation Stage */}
      <div className="absolute inset-0 z-10" style={{ bottom: 56 }}>
        <MotionStage
          currentStage={motionData.stages[currentStepIndex] || null}
          theme="whiteboard"
          topic={topic}
        />
      </div>

      {SyncingOverlay}
      <audio ref={audioRef} className="hidden" />

      {/* ── PLAYER CONTROLS BAR — always visible on white bg ── */}
      <div
        className="absolute bottom-0 inset-x-0 z-[60] px-4 py-2"
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          height: 56,
        }}
      >
        {/* Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden mb-2 cursor-pointer group/pb"
          style={{ backgroundColor: '#E2E8F0' }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366F1, #A855F7)',
            }}
          />
          {/* Thumb dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md transition-all"
            style={{ left: `calc(${progressPct}% - 6px)`, backgroundColor: '#6366F1' }}
          />
          <input
            type="range" min="0" max={totalDuration} step="0.1" value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Play / Pause button — always visible, dark on white */}
          <button
            onClick={handleTogglePlay}
            disabled={isSyncing}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: 34,
              height: 34,
              backgroundColor: isSyncing ? '#E2E8F0' : '#6366F1',
              color: '#FFFFFF',
              cursor: isSyncing ? 'wait' : 'pointer',
              boxShadow: isSyncing ? 'none' : '0 2px 8px #6366F140',
              flexShrink: 0,
            }}
          >
            {isPlaying
              ? <Pause size={15} fill="currentColor" />
              : <Play size={15} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>

          {/* Restart */}
          <button
            onClick={() => { setCurrentTime(0); setCurrentStepIndex(0); setIsPlaying(false); if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } }}
            className="flex items-center justify-center rounded-full transition-all hover:bg-slate-100 active:scale-95"
            style={{ width: 28, height: 28, color: '#64748B', flexShrink: 0 }}
          >
            <RotateCcw size={13} />
          </button>

          {/* Time */}
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#475569', minWidth: 70 }}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {/* Stage indicator dots */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            {motionData.stages.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSeek(motionData.stages.slice(0, i).reduce((a, s) => a + (Number(s.duration) || 10), 0))}
                className="transition-all rounded-full"
                style={{
                  width: i === currentStepIndex ? 18 : 7,
                  height: 7,
                  backgroundColor: i === currentStepIndex ? '#6366F1' : i < currentStepIndex ? '#A5B4FC' : '#CBD5E1',
                }}
              />
            ))}
          </div>

          {/* Volume button */}
          <button
            onClick={() => { setIsMuted(!isMuted); if (audioRef.current) audioRef.current.muted = !isMuted; }}
            className="flex items-center justify-center rounded-full transition-all hover:bg-slate-100 active:scale-95"
            style={{ width: 28, height: 28, color: isMuted ? '#EF4444' : '#64748B', flexShrink: 0 }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

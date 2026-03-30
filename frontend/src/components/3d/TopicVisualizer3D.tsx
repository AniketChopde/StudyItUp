/**
 * TopicVisualizer3D.tsx — Main 3D visualization component.
 * 
 * SAFETY: This component is lazy-loaded and wrapped in an ErrorBoundary
 * so it NEVER crashes the host page. If Three.js fails to load or the
 * API call fails, it shows a graceful fallback.
 */

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObjectMesh, ConnectionLine, AnnotationLabel } from './SceneObjects';
import { findPreset } from './scenePresets';
import type { SceneData, SceneObject } from './scenePresets';
import { Maximize2, Minimize2, RotateCcw, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { NarrativeOverlay } from './NarrativeOverlay';
import { MotionGraphicsCard } from '../video/MotionGraphicsCard';
import apiClient from '../../api/client';

/* ─── Error Boundary ───────────────────────────────────────────────── */
class Visualizer3DErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) {
    console.error('[TopicVisualizer3D] render error:', err);
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20 rounded-2xl border border-border/50">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm font-bold text-muted-foreground">3D rendering unavailable</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Your browser may not support WebGL.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Inner Canvas Scene ───────────────────────────────────────────── */
const Scene3D: React.FC<{ 
  data: SceneData; 
  focusObjectId?: string | null;
  cameraPosition?: [number, number, number] | null;
  cameraPreset?: string | null;
}> = ({ data, focusObjectId, cameraPosition, cameraPreset }) => {
  const { camera } = useThree();
  const objectsMap = useMemo(() => {
    const map: Record<string, SceneObject> = {};
    data.objects.forEach((o) => { map[o.id] = o; });
    return map;
  }, [data]);

  // Camera Animation & Director
  useFrame((state) => {
    if (cameraPosition) {
      const target = new THREE.Vector3(...cameraPosition);
      camera.position.lerp(target, 0.05);
    } else if (cameraPreset) {
      // Cinematic Presets
      const target = new THREE.Vector3();
      switch (cameraPreset) {
        case 'wide-shot': target.set(0, 10, 20); break;
        case 'close-up': target.set(0, 1, 4); break;
        case 'orbit-pan': target.set(Math.sin(state.clock.elapsedTime * 0.2) * 15, 5, Math.cos(state.clock.elapsedTime * 0.2) * 15); break;
        case 'birds-eye': target.set(0, 25, 5); break;
        default: target.set(0, 5, 10);
      }
      camera.position.lerp(target, 0.03);
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#8b5cf6" />

      <Stars radius={100} depth={50} count={1500} factor={3} saturation={0.2} fade speed={0.5} />

      {data.objects.map((obj) => (
        <SceneObjectMesh 
          key={obj.id} 
          obj={obj} 
          isFocused={obj.id === focusObjectId}
        />
      ))}

      {data.connections?.map((conn, i) => (
        <ConnectionLine key={i} conn={conn} objectsMap={objectsMap} />
      ))}

      {data.annotations?.map((ann, i) => (
        <AnnotationLabel key={i} text={ann.text} position={ann.position} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.5}
        maxDistance={25}
        minDistance={2}
      />
    </>
  );
};

/* ─── Loading skeleton ─────────────────────────────────────────────── */
const LoadingSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900/50 to-slate-800/50 rounded-2xl">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
      </div>
    </div>
    <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse">Generating 3D visualization...</p>
    <p className="text-xs text-muted-foreground/60 mt-1">AI is building your interactive scene</p>
  </div>
);

/* ─── Main exported component ──────────────────────────────────────── */
interface TopicVisualizer3DProps {
  topic: string;
  sceneData?: SceneData | null;
  className?: string;
  compact?: boolean;
}

const TopicVisualizer3D: React.FC<TopicVisualizer3DProps> = ({
  topic,
  sceneData: externalSceneData,
  className = '',
  compact = false,
}) => {
  const [scene, setScene] = useState<SceneData | null>(externalSceneData || null);
  const [loading, setLoading] = useState(!externalSceneData);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // --- Narrative State ---
  const [narrativeActive, setNarrativeActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchScene = useCallback(async () => {
    if (externalSceneData) { setScene(externalSceneData); setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      // Use the global apiClient
      const res = await apiClient.get(`/content/visualize?topic=${encodeURIComponent(topic)}&plan_id=auto`);
      setScene(res.data as SceneData);
    } catch (err: any) {
      console.warn('[TopicVisualizer3D] API failed, trying presets:', err?.message);
      // Graceful fallback to preset
      const preset = findPreset(topic);
      if (preset) {
        setScene(preset);
      } else {
        setError('Could not generate visualization. Try a different topic.');
      }
    } finally {
      setLoading(false);
    }
  }, [topic, externalSceneData]);

  useEffect(() => { fetchScene(); }, [fetchScene]);

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // --- Narration Logic ---
  const playStep = useCallback(async (index: number) => {
    if (!scene?.narrative_steps?.[index]) return;
    const step = scene.narrative_steps[index];

    setIsPlaying(false);
    setAudioProgress(0);

    try {
      // 1. Get Audio from Sarvam AI
      const res = await apiClient.post('/voice/tts', { text: step.text });
      const audioData = res.data.audio_base64;
      
      // 2. Play Audio
      if (audioRef.current) {
        audioRef.current.src = `data:audio/wav;base64,${audioData}`;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio synthesis failed:', err);
      // Auto-advance if audio fails? Or just show text
      setIsPlaying(true); 
    }
  }, [scene]);

  const handleStartNarrative = () => {
    if (!scene?.narrative_steps?.length) return;
    setNarrativeActive(true);
    setCurrentStepIndex(0);
    playStep(0);
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < (scene?.narrative_steps?.length || 0) - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      playStep(next);
    } else {
      setNarrativeActive(false);
    }
  };

  // Sync audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const prog = (audio.currentTime / audio.duration) * 100;
      setAudioProgress(prog);
    };

    const onEnded = () => {
      handleNextStep();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentStepIndex, scene]);

  /* ─── render ─── */
  const height = compact ? 'h-[350px]' : 'h-[500px]';

  return (
    <Visualizer3DErrorBoundary>
      <div ref={containerRef} className={`relative rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl ${height} ${className}`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-slate-900/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">3D Visualization</span>
          </div>
          <div className="flex items-center gap-1">
            {scene && scene.narrative_steps && scene.narrative_steps.length > 0 && !narrativeActive && (
              <button
                onClick={handleStartNarrative}
                className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20 mr-1"
                title="Play AI Explanation"
              >
                <Sparkles size={12} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Start Narrative</span>
              </button>
            )}
            {scene && (
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Scene info"
              >
                <Info size={14} />
              </button>
            )}
            <button
              onClick={() => { setScene(null); fetchScene(); }}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Regenerate"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handleFullscreen}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Info panel */}
        {showInfo && scene && (
          <div className="absolute top-14 left-4 right-4 z-10 p-4 bg-slate-800/95 backdrop-blur rounded-xl border border-slate-600/50 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-1">{scene.title}</h4>
            <p className="text-xs text-slate-400 mb-2">{scene.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="bg-slate-700 px-2 py-0.5 rounded">{scene.scene_type}</span>
              <span>{scene.objects.length} objects</span>
              <span>•</span>
              <span>Drag to rotate • Scroll to zoom</span>
            </div>
          </div>
        )}

        {/* Motion Graphics Layer */}
        <MotionGraphicsCard
          type={scene?.narrative_steps?.[currentStepIndex]?.motion_graphic || 'none'}
          title={scene?.narrative_steps?.[currentStepIndex]?.caption || ''}
          description={scene?.narrative_steps?.[currentStepIndex]?.text || ''}
          visible={narrativeActive}
        />

        {/* Narrative Overlay */}
        <NarrativeOverlay
          currentStep={scene?.narrative_steps?.[currentStepIndex] || null}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSkip={handleNextStep}
          onClose={() => setNarrativeActive(false)}
          progress={audioProgress}
          totalSteps={scene?.narrative_steps?.length || 0}
          currentIndex={currentStepIndex}
        />

        {/* Hidden Audio Element */}
        <audio ref={audioRef} className="hidden" />

        {/* Canvas or loading/error states */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <p className="text-sm font-bold text-slate-300">{error}</p>
            <button onClick={fetchScene} className="mt-3 text-xs font-bold text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : scene ? (
          <Suspense fallback={<LoadingSkeleton />}>
            <Canvas
              camera={{
                position: scene.camera?.position || [0, 2, 8],
                fov: scene.camera?.fov || 50,
              }}
              style={{ background: 'transparent' }}
              gl={{ antialias: true, alpha: true }}
            >
              <Scene3D 
                data={scene} 
                focusObjectId={narrativeActive ? scene.narrative_steps?.[currentStepIndex]?.focus_object_id : null}
                cameraPosition={narrativeActive ? scene.narrative_steps?.[currentStepIndex]?.camera_position : null}
                cameraPreset={narrativeActive ? scene.narrative_steps?.[currentStepIndex]?.camera_preset : null}
              />
            </Canvas>
          </Suspense>
        ) : null}

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />

        {/* Interaction hint */}
        {scene && !loading && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full backdrop-blur pointer-events-none">
            🖱️ Drag to rotate • Scroll to zoom • Hover for details
          </div>
        )}
      </div>
    </Visualizer3DErrorBoundary>
  );
};

export default TopicVisualizer3D;

import { useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import TopicVisualizer3D from '../3d/TopicVisualizer3D';

interface AnimationVideoPlayerProps {
  topic: string;
  onClose?: () => void;
}

export default function AnimationVideoPlayer({
  topic,
  onClose
}: AnimationVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTime = 0;
  const duration = 1;
  const showOverlay = true;
  
  // Direct state for the nested visualizer
  const [narrativeActive, setNarrativeActive] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!narrativeActive) setNarrativeActive(true);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      {/* 3D Visualizer Core (acting as the video background) */}
      <div className="absolute inset-0 z-0">
         <TopicVisualizer3D 
            topic={topic}
            compact={false}
            className="!h-full !rounded-none !bg-transparent !border-none !shadow-none"
         />
      </div>

      {/* Video Overlay Layer */}
      <div className={`absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 ${showOverlay ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Top Bar */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20">
                Nexus AI Video
              </div>
              <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">HD • Educational</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {topic} <span className="text-white/20 ml-2">Explanation</span>
            </h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white backdrop-blur-md border border-white/5"
          >
            <RotateCcw size={18} />
          </Button>
        </div>

        {/* Cinematic Watermark */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 opacity-20 pointer-events-none">
          <div className="rotate-90 origin-left">
            <span className="text-xs font-black uppercase tracking-[1em] text-white">GEN-AI CINEMATIC ENGINE</span>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 inset-x-0 p-8 space-y-6">
          {/* Progress Bar */}
          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group/bar">
            <div 
              className="absolute h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
              style={{ width: `${(currentTime/duration) * 100}%` }} 
            />
            <div className="absolute inset-0 hover:bg-white/5 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                onClick={togglePlay}
                size="icon"
                className="h-14 w-14 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-2xl"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="translate-x-0.5" fill="currentColor" />}
              </Button>

              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Now Narrating</span>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-sm font-bold text-white tracking-wide uppercase">AI Concept Analysis</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                <Volume2 size={16} className="text-white/40" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">Sarvam AI Enabled</span>
              </div>
              
              <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white">
                <Maximize2 size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Film Grain Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

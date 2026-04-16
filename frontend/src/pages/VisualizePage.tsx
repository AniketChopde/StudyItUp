/**
 * VisualizePage.tsx — Standalone page at `/visualize` for exploring
 * 3D animated visualizations of any study topic.
 *
 * SAFETY: The 3D component is lazy-loaded. If it fails, the rest of
 * the app is unaffected.
 */

import React, { useState, lazy, Suspense } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Sparkles, Search, Atom, Orbit, Waves, Zap, History, X } from 'lucide-react';

// Lazy-load the Motion Video component
const MotionVideoPlayer = lazy(() => import('../components/video/MotionVideoPlayer'));

const SUGGESTED_TOPICS = [
  { label: 'Atom Structure', icon: Atom, color: 'text-blue-500' },
  { label: 'Solar System', icon: Orbit, color: 'text-amber-500' },
  { label: 'Wave Motion', icon: Waves, color: 'text-cyan-500' },
  { label: 'Electric Circuit', icon: Zap, color: 'text-green-500' },
  { label: 'DNA Double Helix', icon: Sparkles, color: 'text-purple-500' },
  { label: 'Water Molecule', icon: Atom, color: 'text-sky-500' },
  { label: 'Photosynthesis Process', icon: Sparkles, color: 'text-emerald-500' },
  { label: 'Magnetic Field Lines', icon: Waves, color: 'text-rose-500' },
];

export const VisualizePage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleVisualize = (t?: string) => {
    const target = t || topic.trim();
    if (!target) return;
    setActiveTopic(target);
    setHistory((prev) => {
      const next = [target, ...prev.filter((h) => h !== target)].slice(0, 10);
      return next;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVisualize();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/10 p-8 md:p-12">
        <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
          <Sparkles className="h-32 w-32 text-indigo-500" />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              AI Motion Graphics
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI-Generated Animation Videos
          </h1>
          <p className="text-muted-foreground font-medium">
            Type any study topic and our AI will generate a professional narrated animation video to help you understand the concept.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a topic... e.g. 'Atom Structure', 'Solar System', 'DNA'"
            className="h-14 pl-12 text-lg rounded-2xl"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button
          onClick={() => handleVisualize()}
          disabled={!topic.trim()}
          className="h-14 px-8 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Visualize
        </Button>
      </div>

      {/* Suggested */}
      {!activeTopic && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            Popular Topics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => { setTopic(t.label); handleVisualize(t.label); }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group text-left"
              >
                <t.icon className={`h-5 w-5 ${t.color}`} />
                <span className="text-sm font-bold group-hover:text-primary transition-colors">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !activeTopic && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            Recent
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                onClick={() => { setTopic(h); handleVisualize(h); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all text-xs font-bold"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3D Visualizer */}
      {activeTopic && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black">{activeTopic}</h2>
              <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                Interactive
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTopic(null)}
              className="rounded-full"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>

          <div className="w-full max-w-5xl mx-auto h-[50vh] sm:h-[60vh] md:h-[75vh] min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] max-h-[850px] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(88,196,221,0.06)] border border-white/5 bg-[#0f0f23]">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#0f0f23]">
                  <Loading size="lg" text="Generating Animation..." />
                </div>
              }
            >
            <MotionVideoPlayer 
               topic={activeTopic} 
               onClose={() => setActiveTopic(null)} 
            />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizePage;

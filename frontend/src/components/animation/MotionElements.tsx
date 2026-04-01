import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Cpu, Atom, Brain, Globe, Zap, Info, BookOpen,
  Battery, Lightbulb, Share2, Layers, Star, Rocket,
  Activity, Database, Server, Leaf, Microscope, Dna,
  ArrowRight, GitBranch, Code2, Binary, Workflow,
  CheckCircle, Target, TrendingUp, Users, MessageCircle,
  FlaskConical, Wifi, Cloud, Lock, Search, BarChart3,
  PieChart, Award, HelpCircle, RefreshCw, Eye, Heart
} from 'lucide-react';
import type { MotionElement } from './motionTypes';

/* ══════════════════════════════════════
   COLOR PALETTE
   ══════════════════════════════════════ */
const PALETTES = [
  { bg: '#EEF2FF', border: '#818CF8', accent: '#6366F1', text: '#3730A3' },
  { bg: '#ECFDF5', border: '#6EE7B7', accent: '#10B981', text: '#065F46' },
  { bg: '#FFF7ED', border: '#FDBA74', accent: '#F97316', text: '#9A3412' },
  { bg: '#FDF2F8', border: '#D8B4FE', accent: '#A855F7', text: '#6B21A8' },
  { bg: '#FEF2F2', border: '#FCA5A5', accent: '#EF4444', text: '#991B1B' },
  { bg: '#F0FDFA', border: '#5EEAD4', accent: '#14B8A6', text: '#115E59' },
  { bg: '#EFF6FF', border: '#93C5FD', accent: '#3B82F6', text: '#1E40AF' },
  { bg: '#FFFBEB', border: '#FCD34D', accent: '#F59E0B', text: '#92400E' },
];

const getPalette = (id: string, color?: string) => {
  const colorMap: Record<string, number> = {
    '#6366F1': 0, '#1565C0': 6, '#3B82F6': 6,
    '#10B981': 1, '#2E7D32': 1,
    '#F97316': 2, '#E65100': 2,
    '#A855F7': 3, '#6A1B9A': 3,
    '#EF4444': 4, '#C62828': 4,
    '#14B8A6': 5, '#0891B2': 5,
  };
  if (color && colorMap[color] !== undefined) return PALETTES[colorMap[color]];
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
};

/* ══════════════════════════════════════
   ICON MAP
   ══════════════════════════════════════ */
const ICONS: Record<string, any> = {
  brain: Brain, lightbulb: Lightbulb, cpu: Cpu, globe: Globe,
  zap: Zap, atom: Atom, book: BookOpen, star: Star, rocket: Rocket,
  check: CheckCircle, target: Target, trend: TrendingUp, users: Users,
  chat: MessageCircle, flask: FlaskConical, wifi: Wifi, cloud: Cloud,
  lock: Lock, search: Search, chart: BarChart3, pie: PieChart,
  award: Award, help: HelpCircle, refresh: RefreshCw, db: Database,
  server: Server, layers: Layers, code: Code2, git: GitBranch,
  workflow: Workflow, molecule: Dna, leaf: Leaf, info: Info,
  battery: Battery, circuit: Share2, pulse: Activity, binary: Binary,
  arrow: ArrowRight, cell: Microscope, eye: Eye, heart: Heart,
};

const getIconComp = (name?: string) => ICONS[name?.toLowerCase() || 'info'] || Info;

/* ══════════════════════════════════════
   TYPEWRITER TEXT
   ══════════════════════════════════════ */
const TypewriterText: React.FC<{
  text: string; delay?: number; color?: string; className?: string;
}> = ({ text, delay = 0, color = '#1E293B', className = '' }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        if (i < text.length) setDisplayed(text.slice(0, ++i));
        else clearInterval(iv);
      }, 30);
      return () => clearInterval(iv);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [text, delay]);

  return (
    <span className={className} style={{ color }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        style={{ display: 'inline-block', width: 2, height: '0.85em', marginLeft: 2, backgroundColor: color, verticalAlign: 'text-bottom' }}
      />
    </span>
  );
};

/* ══════════════════════════════════════
   KATEX
   ══════════════════════════════════════ */
const MathRenderer: React.FC<{ expression: string; color?: string }> = ({ expression, color = '#1E293B' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try { katex.render(expression, ref.current, { throwOnError: false, displayMode: true }); }
      catch { if (ref.current) ref.current.textContent = expression; }
    }
  }, [expression]);
  return <div ref={ref} style={{ color, fontSize: '1.2em' }} />;
};

/* ══════════════════════════════════════
   ILLUSTRATION ART CARD
   Big icon + colored background + label
   ══════════════════════════════════════ */
const ArtCard: React.FC<{
  id: string; label: string; sublabel?: string;
  iconName?: string; color?: string; delay?: number;
  w: number; h: number;
}> = ({ id, label, sublabel, iconName, color, delay = 0, w, h }) => {
  const p = getPalette(id, color);
  const Icon = getIconComp(iconName);
  const isLarge = h >= 25;
  const iconSz = isLarge ? 56 : 32;
  const safeSublabel = sublabel ? (sublabel.length > 35 ? sublabel.slice(0, 35) + '…' : sublabel) : '';

  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: p.bg, border: `2.5px solid ${p.border}`, boxShadow: `0 6px 24px ${p.accent}18` }}
      initial={{ opacity: 0, scale: 0.75, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.55, type: 'spring', stiffness: 240, damping: 20 }}
    >
      {/* Icon area — shrinks to give text room */}
      <div
        className="flex items-center justify-center relative overflow-hidden flex-shrink"
        style={{ flex: isLarge ? '1 1 55%' : '1 1 45%', background: `linear-gradient(145deg, ${p.accent}10, ${p.accent}05)` }}
      >
        {isLarge && (
          <div className="absolute" style={{
            width: iconSz * 2, height: iconSz * 2, borderRadius: '50%',
            border: `2px dashed ${p.accent}20`,
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }} />
        )}
        <motion.div
          style={{ width: iconSz, height: iconSz, position: 'relative', zIndex: 2, color: p.accent }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.25, duration: 0.5, type: 'spring' }}
        >
          <Icon style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Text area — always visible, never clipped */}
      <div className="px-2 py-1.5 flex flex-col items-center justify-center flex-shrink-0"
        style={{ borderTop: `1px solid ${p.accent}15` }}
      >
        <motion.p
          className="font-bold text-center leading-tight w-full"
          style={{
            color: p.text,
            fontSize: isLarge ? '0.85rem' : '0.72rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.35 }}
        >{label}</motion.p>
        {safeSublabel && (
          <motion.p
            className="text-center leading-snug w-full"
            style={{
              color: '#94A3B8',
              fontSize: isLarge ? '0.6rem' : '0.52rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginTop: 1,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >{safeSublabel}</motion.p>
        )}
      </div>
    </motion.div>
  );
};



/* ══════════════════════════════════════
   IMAGE CARD — shows fetched illustration
   With graceful fallback to icon card
   ══════════════════════════════════════ */
const ImageCard: React.FC<{
  imageUrl?: string; label: string; visualPrompt?: string; delay?: number; id: string;
}> = ({ imageUrl, label, visualPrompt, delay = 0, id }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const p = getPalette(id);
  // If no image URL or image failed, show a nice illustration card
  if (!imageUrl || imgFailed) {
    return (
      <motion.div
        className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: p.bg, border: `2px solid ${p.border}`, boxShadow: `0 6px 20px ${p.accent}15` }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5, type: 'spring' }}
      >
        {/* Icon area — takes most of the space */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ flex: '1 1 65%', background: `linear-gradient(145deg, ${p.accent}08, ${p.accent}04)` }}
        >
          <motion.div
            style={{ color: p.accent, width: 72, height: 72 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
          >
            <Brain style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
          </motion.div>
        </div>
        {/* Label only — clean, no sublabel overlap */}
        <div className="px-3 py-3 overflow-hidden" style={{ flex: '0 0 35%', borderTop: `1px solid ${p.border}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="font-bold text-center text-sm leading-tight" style={{ color: p.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: '#FFF', border: '2px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="flex items-center justify-center p-2 overflow-hidden" style={{ flex: '1 1 70%' }}>
        <img
          src={imageUrl}
          alt={label}
          loading="lazy"
          className="max-w-full max-h-full object-contain"
          style={{ borderRadius: 8 }}
          onError={() => setImgFailed(true)}
        />
      </div>
      {label && (
        <div className="px-3 pb-2" style={{ flex: '0 0 auto', maxHeight: '30%' }}>
          <motion.p
            className="text-xs font-semibold text-center leading-tight truncate"
            style={{ color: '#475569' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
          >{label}</motion.p>
        </div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════
   CIRCLE BUBBLE — always shows text
   ══════════════════════════════════════ */
const CircleBubble: React.FC<{ label?: string; color?: string; delay?: number; id: string }> = ({
  label, color, delay = 0, id
}) => {
  const p = getPalette(id, color);
  // Always have a display name — derive from id if label is empty
  const displayLabel = (label && label.trim()) ? label : id.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          backgroundColor: p.bg,
          border: `2.5px solid ${p.border}`,
          boxShadow: `0 4px 18px ${p.accent}22`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay, duration: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
      />
      <motion.span
        className="relative z-10 font-extrabold text-center px-3 leading-tight"
        style={{
          color: p.text,
          fontSize: '0.85rem',
          textShadow: '0 0 8px white, 0 0 4px white, 0 0 2px white',
          letterSpacing: '-0.01em',
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.3 }}
      >{displayLabel}</motion.span>
    </div>
  );
};


/* ══════════════════════════════════════
   CONNECTOR ARROW
   ══════════════════════════════════════ */
const ConnectorArrow: React.FC<{ element: MotionElement; allElements: MotionElement[] }> = ({ element, allElements }) => {
  const from = allElements.find(e => e.id === element.from_id);
  const to = allElements.find(e => e.id === element.to_id);
  if (!from || !to) return null;

  // Offset endpoints to element edges (not centers) so lines don't cut through text
  const fx = from.position[0], fy = from.position[1];
  const tx = to.position[0], ty = to.position[1];
  const fw = (from.size?.[0] || 15) / 2; // half-width in % 
  const fh = (from.size?.[1] || 12) / 2;
  const tw = (to.size?.[0] || 15) / 2;
  const th = (to.size?.[1] || 12) / 2;

  // Calculate direction vector and offset from edge
  const dx = tx - fx, dy = ty - fy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist, ny = dy / dist; // normalized direction

  // Offset from edge of source and target
  const x1 = fx + nx * Math.min(fw, fh) * 0.9;
  const y1 = fy + ny * Math.min(fw, fh) * 0.9;
  const x2 = tx - nx * Math.min(tw, th) * 0.9;
  const y2 = ty - ny * Math.min(tw, th) * 0.9;

  const delay = element.delay || 0.5;
  const clr = (element.color && !['#FFFF00','white','#ffffff','#FFFFFF'].includes(element.color)) ? element.color : '#94A3B8';

  return (
    <motion.svg className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay }}>
      <defs>
        <marker id={`ah-${element.id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0,0 8,3 0,6" fill={clr} />
        </marker>
      </defs>
      <motion.line
        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
        stroke={clr} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={element.arrow_style === 'dashed' ? '8,5' : '6,4'}
        markerEnd={`url(#ah-${element.id})`}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.7, ease: 'easeInOut' }}
      />
      {element.label && (
        <motion.foreignObject
          x={`${(x1+x2)/2 - 6}%`} y={`${(y1+y2)/2 - 3}%`} width="12%" height="6%"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.6 }}
        >
          <div style={{
            backgroundColor: 'white', border: `1.5px solid ${clr}`, borderRadius: 6,
            padding: '1px 6px', fontSize: '0.58rem', fontWeight: 700, color: clr,
            textAlign: 'center', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}>{element.label}</div>
        </motion.foreignObject>
      )}
    </motion.svg>
  );
};

/* ══════════════════════════════════════
   MAIN ELEMENT RENDERER
   ══════════════════════════════════════ */
const WhiteboardElement: React.FC<{ element: MotionElement }> = ({ element }) => {
  const posX = element.position?.[0] ?? 50;
  const posY = element.position?.[1] ?? 50;
  const w = element.size?.[0] || 25;
  const h = element.size?.[1] || 20;
  const delay = element.delay || 0;
  const safeColor = (element.color && !['#FFFFFF','#ffffff','white','#FFFF00'].includes(element.color)) ? element.color : '#1E293B';

  const fontSizeMap: Record<string, string> = {
    sm: '0.8rem', md: '0.95rem', lg: '1.15rem', xl: '1.35rem', '2xl': '1.6rem', '3xl': '1.9rem',
  };
  const fontSize = fontSizeMap[element.font_size || 'md'] || '0.95rem';

  return (
    <div className="absolute" style={{
      left: `${posX}%`, top: `${posY}%`, width: `${w}%`, height: `${h}%`,
      transform: 'translate(-50%, -50%)',
    }}>

      {/* TEXT */}
      {element.type === 'text' && (
        <div className={`w-full h-full flex items-center ${
          element.text_align === 'left' ? 'justify-start' : element.text_align === 'right' ? 'justify-end' : 'justify-center'
        }`}>
          {element.animation === 'typewriter' ? (
            <TypewriterText
              text={element.label}
              delay={delay}
              color={safeColor}
              className={`leading-tight ${element.font_weight === 'bold' || element.font_weight === 'black' ? 'font-bold' : 'font-semibold'}`}
            />
          ) : (
            <motion.span
              className={`leading-tight ${element.font_weight === 'bold' ? 'font-bold' : 'font-medium'}`}
              style={{ color: safeColor, fontSize }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.4 }}
            >{element.label}</motion.span>
          )}
        </div>
      )}

      {/* BOX / ICON — Illustration Art Card */}
      {(element.type === 'box' || element.type === 'icon') && (
        <ArtCard
          id={element.id} label={element.label}
          sublabel={element.sublabel}
          iconName={element.icon_name}
          color={element.color} delay={delay} w={w} h={h}
        />
      )}

      {/* CIRCLE */}
      {element.type === 'circle' && (
        <CircleBubble id={element.id} label={element.label} color={element.color} delay={delay} />
      )}

      {/* IMAGE — fetched illustration or beautiful fallback */}
      {element.type === 'image' && (
        <ImageCard
          id={element.id}
          imageUrl={element.image_url}
          label={element.label}
          visualPrompt={(element as any).visual_prompt}
          delay={delay}
        />
      )}

      {/* STICK FIGURE */}
      {element.type === 'stick_figure' && (
        <StickFigure
          color={safeColor}
          delay={delay}
          pose={(element as any).pose}
          label={element.label}
        />
      )}

      {/* MATH */}
      {element.type === 'math' && element.math_expression && (
        <motion.div
          className="w-full h-full flex items-center justify-center rounded-xl p-3"
          style={{ backgroundColor: '#FFFBEB', border: '2px solid #F59E0Baa' }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, duration: 0.5, type: 'spring' }}
        >
          <MathRenderer expression={element.math_expression} color="#92400E" />
        </motion.div>
      )}

      {/* CODE */}
      {element.type === 'code' && element.code_content && (
        <motion.div
          className="w-full h-full rounded-xl overflow-auto"
          style={{ backgroundColor: '#1E293B', border: '2px solid #334155' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.45 }}
        >
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <pre className="p-3 text-xs font-mono text-slate-200 whitespace-pre-wrap">{element.code_content}</pre>
        </motion.div>
      )}

      {/* HIGHLIGHT BOX */}
      {element.type === 'highlight-box' && (
        <motion.div
          className="w-full h-full rounded-xl flex items-center justify-center p-3"
          style={{
            backgroundColor: `${element.highlight_color || '#6366F1'}12`,
            border: `2.5px solid ${element.highlight_color || '#6366F1'}`,
          }}
          initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, duration: 0.4, type: 'spring' }}
        >
          <span className="font-bold text-center text-sm" style={{ color: element.highlight_color || '#6366F1' }}>{element.label}</span>
        </motion.div>
      )}

      {/* SCATTER PLOT */}
      {element.type === 'scatter_plot' && <ScatterPlot element={element} delay={delay} />}
    </div>
  );
};

/* ══════════════════════════════════════
   STICK FIGURE
   ══════════════════════════════════════ */
const StickFigure: React.FC<{ color?: string; delay?: number; pose?: string; label?: string }> = ({
  color = '#1E293B', delay = 0, pose = 'standing', label
}) => {
  const isThinking = pose === 'thinking';
  const isPointing = pose === 'pointing' || pose === 'teaching';
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 80 120" className="w-full" style={{ flex: 1 }}>
        <motion.circle cx="40" cy="14" r="11" fill="none" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay, duration: 0.5 }} />
        <motion.circle cx="36" cy="12" r="1.5" fill={color}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5 }} />
        <motion.circle cx="44" cy="12" r="1.5" fill={color}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.5 }} />
        <motion.path d="M 36 18 Q 40 22 44 18" fill="none" stroke={color} strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: delay + 0.6 }} />
        <motion.line x1="40" y1="25" x2="40" y2="72" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: delay + 0.7, duration: 0.4 }} />
        {isThinking ? (
          <>
            <motion.path d="M 40 38 Q 28 44 22 40" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.0 }} />
            <motion.path d="M 40 38 Q 52 32 58 36" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.1 }} />
            <motion.text x="63" y="11" fontSize="12" fill={color} fontWeight="bold"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1.4 }}>?</motion.text>
          </>
        ) : isPointing ? (
          <>
            <motion.path d="M 40 38 Q 28 50 20 55" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.0 }} />
            <motion.path d="M 40 38 Q 56 30 70 26" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.1 }} />
          </>
        ) : (
          <>
            <motion.path d="M 40 38 Q 25 46 18 58" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.0 }} />
            <motion.path d="M 40 38 Q 55 46 62 58" fill="none" stroke={color} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 1.1 }} />
          </>
        )}
        <motion.line x1="40" y1="72" x2="26" y2="108" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: delay + 1.3 }} />
        <motion.line x1="40" y1="72" x2="54" y2="108" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: delay + 1.4 }} />
      </svg>
      {label && (
        <motion.span className="text-xs font-bold text-center mt-1 shrink-0" style={{ color }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1.6 }}
        >{label}</motion.span>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   SCATTER PLOT
   ══════════════════════════════════════ */
const ScatterPlot: React.FC<{ element: MotionElement; delay: number }> = ({ element, delay }) => (
  <motion.div
    className="w-full h-full rounded-2xl overflow-hidden"
    style={{ backgroundColor: '#F8FAFF', border: '2px solid #6366F133' }}
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5, type: 'spring' }}
  >
    <div className="px-3 pt-2"><p className="text-xs font-bold text-indigo-700">{element.label || 'Data'}</p></div>
    <svg viewBox="0 0 200 140" className="w-full" style={{ height: '80%' }}>
      <motion.line x1="18" y1="125" x2="190" y2="125" stroke="#334155" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.2 }} />
      <motion.line x1="18" y1="10" x2="18" y2="125" stroke="#334155" strokeWidth="2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.3 }} />
      {[{x:55,y:90,c:'#EF4444'},{x:75,y:98,c:'#EF4444'},{x:45,y:100,c:'#EF4444'},
        {x:130,y:40,c:'#6366F1'},{x:150,y:30,c:'#6366F1'},{x:140,y:48,c:'#6366F1'},{x:158,y:42,c:'#6366F1'}
      ].map((pt, i) => (
        <motion.circle key={i} cx={pt.x} cy={pt.y} r="5.5" fill={pt.c} stroke="white" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: delay + 0.8 + i * 0.08, type: 'spring' }} />
      ))}
    </svg>
  </motion.div>
);

/* ══════════════════════════════════════
   TOP-LEVEL RENDERER
   ══════════════════════════════════════ */
export const MotionRenderer = forwardRef<HTMLDivElement, { elements: MotionElement[]; theme?: string }>(
  ({ elements }, ref) => {
    const connectors = elements.filter(e => e.type === 'connector');
    const visuals = elements.filter(e => e.type !== 'connector');
    return (
      <div ref={ref} className="w-full h-full relative">
        {connectors.map(c => <ConnectorArrow key={c.id} element={c} allElements={elements} />)}
        <AnimatePresence>
          {visuals.map(el => <WhiteboardElement key={el.id} element={el} />)}
        </AnimatePresence>
      </div>
    );
  }
);

MotionRenderer.displayName = 'MotionRenderer';

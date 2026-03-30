import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  Cpu, Atom, Brain, Globe, Zap, Info, 
  Battery, Lightbulb, Share2, Layers,
  Activity, Database, Server, Leaf, Microscope, Dna,
  ArrowRight, GitBranch, Code2, Binary, Workflow
} from 'lucide-react';
import type { MotionElement } from './motionTypes';

/* ============================================================
   MANIM COLOR PALETTE
   ============================================================ */
const MANIM_COLORS = {
  blue: '#58C4DD',
  yellow: '#FFFF00',
  green: '#83C167',
  red: '#FC6255',
  purple: '#9A72AC',
  teal: '#5CD0B3',
  orange: '#FF862F',
  pink: '#FF69B4',
  white: '#FFFFFF',
  grey: '#888888',
};

/* ============================================================
   ICON MAPPER
   ============================================================ */
const getIcon = (name?: string, color?: string) => {
  const icons: Record<string, any> = {
    atom: Atom, brain: Brain, cpu: Cpu, globe: Globe, zap: Zap,
    info: Info, battery: Battery, lightbulb: Lightbulb, circuit: Share2,
    layers: Layers, pulse: Activity, db: Database, server: Server,
    plant: Leaf, cell: Microscope, molecule: Dna, arrow: ArrowRight,
    git: GitBranch, code: Code2, binary: Binary, workflow: Workflow,
  };
  const IconComp = icons[name || 'info'] || Info;
  return <IconComp className="w-full h-full" style={{ color: color || MANIM_COLORS.blue }} />;
};

/* ============================================================
   FONT SIZE MAPPER
   ============================================================ */
const getFontSize = (size?: string) => {
  const map: Record<string, string> = {
    sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl',
    '2xl': 'text-2xl', '3xl': 'text-3xl',
  };
  return map[size || 'md'] || 'text-base';
};

/* ============================================================
   TYPEWRITER TEXT COMPONENT
   ============================================================ */
const TypewriterText: React.FC<{ text: string; delay?: number; color?: string; className?: string }> = ({ text, delay = 0, color, className = '' }) => {
  const [displayed, setDisplayed] = useState('');
  const elementColor = color || 'inherit';
  
  useEffect(() => {
    setDisplayed('');
    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 35);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  return (
    <span className={className} style={{ color: elementColor }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.7 }}
        className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom"
        style={{ backgroundColor: elementColor }}
      />
    </span>
  );
};

/* ============================================================
   KATEX MATH RENDERER
   ============================================================ */
const MathRenderer: React.FC<{ expression: string; color?: string }> = ({ expression, color }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(expression, ref.current, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        });
      } catch {
        if (ref.current) ref.current.textContent = expression;
      }
    }
  }, [expression]);

  return (
    <div 
      ref={ref} 
      className="katex-display-wrapper"
      style={{ color: color || MANIM_COLORS.white, fontSize: '1.4em' }} 
    />
  );
};

/* ============================================================
   CODE BLOCK WITH SYNTAX COLORING
   ============================================================ */
const CodeBlock: React.FC<{ code: string; language?: string; color?: string }> = ({ code, language }) => {
  const lines = code.split('\n');
  
  // Simple keyword highlighting
  const highlightLine = (line: string) => {
    const keywords = ['def', 'class', 'return', 'import', 'from', 'if', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'async', 'await', 'const', 'let', 'var', 'function', 'export', 'interface', 'type'];
    const builtins = ['print', 'len', 'range', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple', 'map', 'filter', 'reduce', 'torch', 'np', 'triton'];
    
    let result = line;
    // Highlight strings
    result = result.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span style="color:#83C167">$&</span>');
    // Highlight comments
    result = result.replace(/(#.*)$/gm, '<span style="color:#666666;font-style:italic">$1</span>');
    // Highlight numbers
    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#FF862F">$1</span>');
    // Highlight keywords
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span style="color:#FC6255;font-weight:bold">$1</span>`);
    });
    // Highlight builtins
    builtins.forEach(bi => {
      result = result.replace(new RegExp(`\\b(${bi})\\b`, 'g'), `<span style="color:#58C4DD">$1</span>`);
    });
    // Highlight decorators
    result = result.replace(/(@\w+)/g, '<span style="color:#FFFF00">$1</span>');
    
    return result;
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 bg-[#1a1a2e]/90 backdrop-blur-sm shadow-[0_0_30px_rgba(88,196,221,0.1)]">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-white/30 ml-2 uppercase tracking-wider">{language || 'code'}</span>
      </div>
      {/* Code content */}
      <div className="p-4 font-mono text-sm leading-relaxed overflow-auto max-h-full">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.3 }}
            className="flex"
          >
            <span className="text-white/20 w-8 text-right mr-4 select-none text-xs">{i + 1}</span>
            <span 
              className="text-white/90 whitespace-pre"
              dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   MANIM ELEMENT — The Core Renderer
   ============================================================ */
const ManimElement: React.FC<{ element: MotionElement }> = ({ element }) => {
  const posX = element.position?.[0] ?? 50;
  const posY = element.position?.[1] ?? 50;
  const w = element.size?.[0] || 25;
  const h = element.size?.[1] || 20;
  const elemDelay = element.delay || 0;
  
  // Force dark colors to white so text is always visible on dark bg
  const ensureBright = (color: string): string => {
    if (!color || color === 'transparent') return MANIM_COLORS.white;
    const lowerColor = color.toLowerCase().trim();
    if (['black', '#000', '#000000', 'navy', '#000080'].includes(lowerColor)) return MANIM_COLORS.white;
    
    // Parse hex color brightness
    const hex = color.replace('#', '');
    if (hex.length === 3 || hex.length === 6) {
      let r, g, b;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness < 80) return MANIM_COLORS.white; // Too dark, use white
    }
    return color;
  };
  
  const elemColor = ensureBright(element.color || MANIM_COLORS.blue);

  // Animation variants based on type
  const getAnimation = () => {
    switch (element.animation) {
      case 'typewriter':
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: elemDelay, duration: 0.3 } };
      case 'draw-line':
        return { initial: { scaleX: 0 }, animate: { scaleX: 1 }, transition: { delay: elemDelay, duration: 0.8, ease: 'easeInOut' } };
      case 'glow-in':
        return { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' }, transition: { delay: elemDelay, duration: 0.6 } };
      case 'write':
        return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: elemDelay, duration: 0.5 } };
      case 'pop':
        return { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: elemDelay, duration: 0.4, type: 'spring' } };
      case 'slide-in':
        return { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, transition: { delay: elemDelay, duration: 0.5 } };
      default: // fade
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: elemDelay, duration: 0.6 } };
    }
  };

  const anim = getAnimation();

  return (
    <motion.div
      layoutId={element.id}
      initial={{ ...anim.initial, x: "-50%", y: "-50%" }}
      animate={{ ...anim.animate, x: "-50%", y: "-50%" }}
      exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
      transition={anim.transition}
      className="absolute flex flex-col items-center justify-center"
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
        width: `${w}%`,
        height: `${h}%`,
      }}
    >
      {/* ---- TEXT ---- */}
      {element.type === 'text' && (
        <div className={`w-full h-full flex items-center justify-center ${element.text_align === 'left' ? 'justify-start text-left' : element.text_align === 'right' ? 'justify-end text-right' : 'text-center'}`}>
          {element.animation === 'typewriter' ? (
            <TypewriterText 
              text={element.label} 
              delay={elemDelay}
              color={elemColor}
              className={`${getFontSize(element.font_size)} ${element.font_weight === 'black' ? 'font-black' : element.font_weight === 'bold' ? 'font-bold' : 'font-normal'} leading-relaxed`}
            />
          ) : (
            <span 
              className={`${getFontSize(element.font_size)} ${element.font_weight === 'black' ? 'font-black' : element.font_weight === 'bold' ? 'font-bold' : 'font-normal'} leading-relaxed`}
              style={{ color: elemColor }}
            >
              {element.label}
            </span>
          )}
        </div>
      )}

      {/* ---- BOX ---- */}
      {element.type === 'box' && (
        <div className="w-full h-full relative flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 rounded-xl border-2"
            style={{ borderColor: elemColor, boxShadow: `0 0 20px ${elemColor}33, inset 0 0 20px ${elemColor}11` }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: elemDelay, duration: 0.8 }}
          />
          <span className="text-white font-bold text-center z-10 px-2" style={{ color: elemColor }}>
            {element.label}
          </span>
        </div>
      )}

      {/* ---- HIGHLIGHT BOX ---- */}
      {element.type === 'highlight-box' && (
        <motion.div 
          className="w-full h-full rounded-xl flex items-center justify-center p-4"
          style={{ 
            backgroundColor: `${element.highlight_color || elemColor}15`,
            border: `1px solid ${element.highlight_color || elemColor}40`,
            boxShadow: `0 0 30px ${element.highlight_color || elemColor}15`
          }}
          animate={{ 
            boxShadow: [
              `0 0 20px ${element.highlight_color || elemColor}10`,
              `0 0 40px ${element.highlight_color || elemColor}25`,
              `0 0 20px ${element.highlight_color || elemColor}10`,
            ]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <span className="text-white font-semibold text-center text-sm leading-relaxed" style={{ color: element.highlight_color || elemColor }}>
            {element.label}
          </span>
        </motion.div>
      )}

      {/* ---- CIRCLE ---- */}
      {element.type === 'circle' && (
        <div className="w-full h-full relative flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: elemColor, boxShadow: `0 0 25px ${elemColor}33` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: elemDelay, duration: 0.5, type: 'spring' }}
          />
          <span className="text-white font-bold z-10 text-center text-sm" style={{ color: elemColor }}>
            {element.label}
          </span>
        </div>
      )}

      {/* ---- CODE ---- */}
      {element.type === 'code' && element.code_content && (
        <CodeBlock 
          code={element.code_content} 
          language={element.language} 
          color={elemColor}
        />
      )}

      {/* ---- MATH (LaTeX) ---- */}
      {element.type === 'math' && element.math_expression && (
        <motion.div 
          className="w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: elemDelay, duration: 0.6, type: 'spring' }}
        >
          <MathRenderer expression={element.math_expression} color={elemColor} />
        </motion.div>
      )}

      {/* ---- ARROW ---- */}
      {element.type === 'arrow' && (
        <motion.div 
          className="w-full h-full flex items-center justify-center"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: elemDelay, duration: 0.5, ease: 'easeOut' }}
          style={{ transformOrigin: 'left center' }}
        >
          <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <marker id={`arrowhead-${element.id}`} markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                <polygon points="0,0 10,4 0,8" fill={elemColor} />
              </marker>
            </defs>
            <line 
              x1="10" y1="20" x2="180" y2="20" 
              stroke={elemColor} 
              strokeWidth="2.5"
              strokeDasharray={element.arrow_style === 'dashed' ? '8,4' : element.arrow_style === 'dotted' ? '3,3' : 'none'}
              markerEnd={`url(#arrowhead-${element.id})`}
              style={{ filter: `drop-shadow(0 0 4px ${elemColor}66)` }}
            />
          </svg>
          {element.label && (
            <span className="absolute text-xs font-bold -top-1" style={{ color: elemColor }}>{element.label}</span>
          )}
        </motion.div>
      )}

      {/* ---- ICON ---- */}
      {element.type === 'icon' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <motion.div 
            className="w-16 h-16"
            style={{ filter: `drop-shadow(0 0 12px ${elemColor}66)` }}
            animate={{ 
              filter: [
                `drop-shadow(0 0 8px ${elemColor}44)`,
                `drop-shadow(0 0 16px ${elemColor}66)`,
                `drop-shadow(0 0 8px ${elemColor}44)`,
              ] 
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            {getIcon(element.icon_name, elemColor)}
          </motion.div>
          {element.label && (
            <span className="text-sm font-bold text-center mt-1" style={{ color: elemColor }}>
              {element.label}
            </span>
          )}
        </div>
      )}

      {/* ---- IMAGE ---- */}
      {element.type === 'image' && element.image_url && (
        <motion.div 
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: elemDelay, duration: 0.8 }}
          className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(88,196,221,0.15)] flex items-center justify-center bg-black/30 p-2"
        >
          <img 
            src={element.image_url} 
            alt={element.label} 
            loading="lazy"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://loremflickr.com/g/800/600/science,technology?lock=${element.id.length}`;
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

/* ============================================================
   CONNECTOR LINES (drawn between elements by from_id → to_id)
   ============================================================ */
const ConnectorLine: React.FC<{ element: MotionElement; allElements: MotionElement[] }> = ({ element, allElements }) => {
  const fromEl = allElements.find(e => e.id === element.from_id);
  const toEl = allElements.find(e => e.id === element.to_id);
  if (!fromEl || !toEl) return null;

  const x1 = fromEl.position[0];
  const y1 = fromEl.position[1];
  const x2 = toEl.position[0];
  const y2 = toEl.position[1];
  const color = element.color || MANIM_COLORS.blue;

  return (
    <motion.svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: element.delay || 0.5, duration: 0.5 }}
    >
      <defs>
        <marker id={`conn-arrow-${element.id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0,0 8,3 0,6" fill={color} />
        </marker>
      </defs>
      <motion.line
        x1={`${x1}%`} y1={`${y1}%`}
        x2={`${x2}%`} y2={`${y2}%`}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray={element.arrow_style === 'dashed' ? '6,4' : 'none'}
        markerEnd={`url(#conn-arrow-${element.id})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: element.delay || 0.5, duration: 0.8, ease: 'easeInOut' }}
        style={{ filter: `drop-shadow(0 0 3px ${color}44)` }}
      />
    </motion.svg>
  );
};

/* ============================================================
   MAIN RENDERER (with forwardRef)
   ============================================================ */
export const MotionRenderer = forwardRef<HTMLDivElement, { elements: MotionElement[]; theme?: string }>(
  ({ elements }, ref) => {
    // Separate connectors
    const connectors = elements.filter(e => e.type === 'connector');
    const visuals = elements.filter(e => e.type !== 'connector');

    return (
      <div ref={ref} className="w-full h-full relative">
        {/* Connector lines first (behind everything) */}
        {connectors.map(conn => (
          <ConnectorLine key={conn.id} element={conn} allElements={elements} />
        ))}
        {/* Visual elements */}
        {visuals.map((el) => (
          <ManimElement key={el.id} element={el} />
        ))}
      </div>
    );
  }
);

MotionRenderer.displayName = 'MotionRenderer';

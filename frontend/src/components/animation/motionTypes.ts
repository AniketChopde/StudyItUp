export interface MotionElement {
  id: string;
  type: 'text' | 'code' | 'math' | 'box' | 'circle' | 'arrow' | 'connector' | 'highlight-box' | 'icon' | 'image' | 'svg' | 'stick_figure' | 'scatter_plot' | 'metaphor_character';
  label: string;
  position: [number, number]; // 0-100 scale
  size: [number, number]; // 0-100 scale
  color: string;
  animation?: 'fade' | 'pop' | 'slide-in' | 'draw' | 'typewriter' | 'draw-line' | 'glow-in' | 'write' | 'bounce' | 'sketch';
  delay?: number; // animation delay in seconds
  continuous_animation?: 'spin' | 'pulse' | 'float' | 'bounce' | 'dash-flow' | 'shake' | 'glitch' | 'none';

  // Stick figure / Metaphor character specific
  pose?: 'standing' | 'thinking' | 'pointing' | 'teaching';
  role?: string;

  // Scatter plot specific
  x_label?: string;
  y_label?: string;
  points?: Array<{ x: number; y: number; color?: string }>;

  // Cinematic effects (not used in whiteboard mode)
  camera_effect?: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'none';
  sketchy?: boolean;

  // Text/Code
  code_content?: string;
  language?: string;
  visual_prompt?: string;

  // Math (LaTeX)
  math_expression?: string;

  // Arrow/Connector
  from_id?: string;
  to_id?: string;
  arrow_style?: 'solid' | 'dashed' | 'dotted';

  // Highlight
  highlight_color?: string;

  // Image
  image_url?: string;

  // Icon
  icon_name?: string;
  sublabel?: string;

  // SVG
  svg_content?: string;

  // Styling
  font_size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  font_weight?: 'normal' | 'bold' | 'black';
  text_align?: 'left' | 'center' | 'right';
  opacity?: number;
  style?: 'dashed' | 'solid' | 'thick';
}

export interface AnimationStage {
  step: number;
  duration: number; // Duration in seconds
  narration: string;
  caption?: string;
  elements: MotionElement[];
  layout_strategy?: 'center' | 'grid' | 'split-view' | 'flow';
  background_color?: string;
}

export interface MotionData {
  theme: 'manim' | 'sketchy' | 'technical' | 'whiteboard';
  title: string;
  description?: string;
  total_duration?: number;
  stages: AnimationStage[];
}

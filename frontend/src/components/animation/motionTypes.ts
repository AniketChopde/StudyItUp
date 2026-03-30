export interface MotionElement {
  id: string;
  type: 'text' | 'code' | 'math' | 'box' | 'circle' | 'arrow' | 'connector' | 'highlight-box' | 'icon' | 'image';
  label: string;
  position: [number, number]; // 0-100 scale
  size: [number, number]; // 0-100 scale
  color: string;
  animation?: 'fade' | 'pop' | 'slide-in' | 'draw' | 'typewriter' | 'draw-line' | 'glow-in' | 'write' | 'bounce';
  delay?: number; // animation delay in seconds

  // Text/Code
  code_content?: string;
  language?: string;
  
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
  caption: string;
  elements: MotionElement[];
  layout_strategy?: 'center' | 'grid' | 'split-view' | 'flow';
  background_color?: string; // per-stage bg tint
}

export interface MotionData {
  theme: 'manim' | 'sketchy' | 'technical';
  title: string;
  description: string;
  total_duration: number;
  stages: AnimationStage[];
}

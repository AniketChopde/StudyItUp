/**
 * Fallback preset scenes for common topics.
 * Used when the backend API is unavailable so the feature degrades gracefully.
 */

export interface SceneObject {
  id: string;
  type: 'sphere' | 'box' | 'cylinder' | 'torus' | 'ring' | 'cone' | 'line' | 'text3d';
  label: string;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  animation: 'rotate' | 'pulse' | 'orbit' | 'wave' | 'float' | 'none';
  animationSpeed: number;
  opacity: number;
  emissive?: boolean;
  tooltip: string;
}

export interface SceneConnection {
  from: string;
  to: string;
  color: string;
  label?: string;
}

export interface SceneAnnotation {
  text: string;
  position: [number, number, number];
}

export interface SceneData {
  scene_type: string;
  title: string;
  description: string;
  objects: SceneObject[];
  connections: SceneConnection[];
  annotations: SceneAnnotation[];
  camera: { position: [number, number, number]; fov: number };
}

// ─── Atom Structure ─────────────────────────────────────────────────
export const atomStructure: SceneData = {
  scene_type: 'molecular',
  title: 'Atom Structure',
  description: 'A simplified Bohr model showing nucleus with protons/neutrons and orbiting electrons.',
  objects: [
    { id: 'nucleus', type: 'sphere', label: 'Nucleus', position: [0, 0, 0], scale: [0.8, 0.8, 0.8], color: '#ef4444', animation: 'pulse', animationSpeed: 0.5, opacity: 1, emissive: true, tooltip: 'The nucleus contains protons (+) and neutrons. It holds most of the atom\'s mass.' },
    { id: 'e1', type: 'sphere', label: 'Electron 1', position: [2, 0, 0], scale: [0.25, 0.25, 0.25], color: '#3b82f6', animation: 'orbit', animationSpeed: 1.2, opacity: 1, tooltip: 'Electrons orbit the nucleus in defined energy levels (shells).' },
    { id: 'e2', type: 'sphere', label: 'Electron 2', position: [-2, 0, 0], scale: [0.25, 0.25, 0.25], color: '#3b82f6', animation: 'orbit', animationSpeed: 1.2, opacity: 1, tooltip: 'First shell (K shell) can hold max 2 electrons.' },
    { id: 'e3', type: 'sphere', label: 'Electron 3', position: [3.5, 0, 0], scale: [0.2, 0.2, 0.2], color: '#8b5cf6', animation: 'orbit', animationSpeed: 0.8, opacity: 1, tooltip: 'Second shell (L shell) is farther from nucleus with higher energy.' },
    { id: 'orbit1', type: 'ring', label: 'K Shell', position: [0, 0, 0], scale: [2, 2, 0.02], color: '#3b82f6', animation: 'none', animationSpeed: 0, opacity: 0.3, tooltip: 'K shell — the first electron shell closest to the nucleus.' },
    { id: 'orbit2', type: 'ring', label: 'L Shell', position: [0, 0, 0], scale: [3.5, 3.5, 0.02], color: '#8b5cf6', animation: 'none', animationSpeed: 0, opacity: 0.2, tooltip: 'L shell — the second electron shell, can hold up to 8 electrons.' },
  ],
  connections: [],
  annotations: [
    { text: 'Protons define the element (atomic number)', position: [0, 2, 0] },
    { text: 'Electrons determine chemical behavior', position: [0, -2, 0] },
  ],
  camera: { position: [0, 3, 8], fov: 50 },
};

// ─── Solar System ───────────────────────────────────────────────────
export const solarSystem: SceneData = {
  scene_type: 'orbital',
  title: 'Solar System (Inner Planets)',
  description: 'The Sun with the four inner rocky planets orbiting around it.',
  objects: [
    { id: 'sun', type: 'sphere', label: 'Sun', position: [0, 0, 0], scale: [1.2, 1.2, 1.2], color: '#fbbf24', animation: 'pulse', animationSpeed: 0.3, opacity: 1, emissive: true, tooltip: 'The Sun — a G-type main-sequence star containing 99.86% of the solar system\'s mass.' },
    { id: 'mercury', type: 'sphere', label: 'Mercury', position: [2, 0, 0], scale: [0.15, 0.15, 0.15], color: '#9ca3af', animation: 'orbit', animationSpeed: 2, opacity: 1, tooltip: 'Mercury — smallest planet, closest to the Sun. Orbital period: 88 days.' },
    { id: 'venus', type: 'sphere', label: 'Venus', position: [3, 0, 0], scale: [0.3, 0.3, 0.3], color: '#f97316', animation: 'orbit', animationSpeed: 1.5, opacity: 1, tooltip: 'Venus — hottest planet due to runaway greenhouse effect. Rotates backwards.' },
    { id: 'earth', type: 'sphere', label: 'Earth', position: [4, 0, 0], scale: [0.32, 0.32, 0.32], color: '#3b82f6', animation: 'orbit', animationSpeed: 1, opacity: 1, tooltip: 'Earth — the only known planet with liquid water and life. Orbital period: 365.25 days.' },
    { id: 'mars', type: 'sphere', label: 'Mars', position: [5, 0, 0], scale: [0.2, 0.2, 0.2], color: '#dc2626', animation: 'orbit', animationSpeed: 0.7, opacity: 1, tooltip: 'Mars — the "Red Planet". Has the tallest volcano (Olympus Mons) in the solar system.' },
    { id: 'orbit_m', type: 'ring', label: '', position: [0, 0, 0], scale: [2, 2, 0.01], color: '#9ca3af', animation: 'none', animationSpeed: 0, opacity: 0.15, tooltip: 'Mercury orbit' },
    { id: 'orbit_v', type: 'ring', label: '', position: [0, 0, 0], scale: [3, 3, 0.01], color: '#f97316', animation: 'none', animationSpeed: 0, opacity: 0.15, tooltip: 'Venus orbit' },
    { id: 'orbit_e', type: 'ring', label: '', position: [0, 0, 0], scale: [4, 4, 0.01], color: '#3b82f6', animation: 'none', animationSpeed: 0, opacity: 0.15, tooltip: 'Earth orbit' },
    { id: 'orbit_r', type: 'ring', label: '', position: [0, 0, 0], scale: [5, 5, 0.01], color: '#dc2626', animation: 'none', animationSpeed: 0, opacity: 0.15, tooltip: 'Mars orbit' },
  ],
  connections: [],
  annotations: [
    { text: 'Inner planets are rocky (terrestrial)', position: [0, 2.5, 0] },
  ],
  camera: { position: [0, 6, 10], fov: 50 },
};

// ─── Wave Motion ────────────────────────────────────────────────────
export const waveMotion: SceneData = {
  scene_type: 'wave',
  title: 'Transverse Wave Motion',
  description: 'Particles oscillating perpendicular to the direction of wave propagation.',
  objects: Array.from({ length: 12 }, (_, i) => ({
    id: `particle_${i}`,
    type: 'sphere' as const,
    label: `P${i + 1}`,
    position: [-5 + i * 0.9, 0, 0] as [number, number, number],
    scale: [0.2, 0.2, 0.2] as [number, number, number],
    color: i % 2 === 0 ? '#06b6d4' : '#8b5cf6',
    animation: 'wave' as const,
    animationSpeed: 1 + i * 0.15,
    opacity: 1,
    tooltip: `Particle ${i + 1} — oscillates up and down while the wave travels horizontally.`,
  })),
  connections: [],
  annotations: [
    { text: 'Wave direction →', position: [3, 2, 0] },
    { text: 'Amplitude = max displacement', position: [-3, 2, 0] },
  ],
  camera: { position: [0, 3, 8], fov: 50 },
};

// ─── Simple Circuit ─────────────────────────────────────────────────
export const circuitBasic: SceneData = {
  scene_type: 'circuit',
  title: 'Simple Electric Circuit',
  description: 'A battery, resistor, and bulb connected in a simple series circuit.',
  objects: [
    { id: 'battery', type: 'box', label: 'Battery', position: [-3, 0, 0], scale: [0.8, 1.2, 0.4], color: '#22c55e', animation: 'pulse', animationSpeed: 0.5, opacity: 1, emissive: true, tooltip: 'Battery — provides electromotive force (EMF) to push electrons through the circuit.' },
    { id: 'resistor', type: 'box', label: 'Resistor', position: [0, 2, 0], scale: [1.2, 0.4, 0.4], color: '#f59e0b', animation: 'none', animationSpeed: 0, opacity: 1, tooltip: 'Resistor — opposes current flow, converts electrical energy to heat. Measured in Ohms (Ω).' },
    { id: 'bulb', type: 'sphere', label: 'Bulb', position: [3, 0, 0], scale: [0.6, 0.6, 0.6], color: '#fbbf24', animation: 'pulse', animationSpeed: 1, opacity: 0.9, emissive: true, tooltip: 'Light Bulb — converts electrical energy to light and heat energy.' },
    { id: 'wire_bottom', type: 'box', label: 'Wire', position: [0, -2, 0], scale: [6, 0.1, 0.1], color: '#64748b', animation: 'none', animationSpeed: 0, opacity: 0.7, tooltip: 'Conducting wire — allows electrons to flow through the circuit.' },
    { id: 'electron1', type: 'sphere', label: 'e⁻', position: [-1, -2, 0], scale: [0.15, 0.15, 0.15], color: '#3b82f6', animation: 'float', animationSpeed: 2, opacity: 1, tooltip: 'Electron — negatively charged particles that flow from negative to positive terminal.' },
    { id: 'electron2', type: 'sphere', label: 'e⁻', position: [1, -2, 0], scale: [0.15, 0.15, 0.15], color: '#3b82f6', animation: 'float', animationSpeed: 2.5, opacity: 1, tooltip: 'Current direction is opposite to electron flow (conventional current).' },
  ],
  connections: [
    { from: 'battery', to: 'resistor', color: '#64748b', label: 'Current flows' },
    { from: 'resistor', to: 'bulb', color: '#64748b' },
    { from: 'bulb', to: 'battery', color: '#64748b' },
  ],
  annotations: [
    { text: 'V = IR (Ohm\'s Law)', position: [0, 3.5, 0] },
    { text: 'Current flows from + to − terminal', position: [0, -3.5, 0] },
  ],
  camera: { position: [0, 2, 10], fov: 50 },
};

// ─── Preset lookup ──────────────────────────────────────────────────
const presetKeywords: Record<string, SceneData> = {
  atom: atomStructure,
  atomic: atomStructure,
  electron: atomStructure,
  proton: atomStructure,
  nucleus: atomStructure,
  bohr: atomStructure,
  solar: solarSystem,
  planet: solarSystem,
  orbit: solarSystem,
  earth: solarSystem,
  wave: waveMotion,
  oscillation: waveMotion,
  transverse: waveMotion,
  longitudinal: waveMotion,
  frequency: waveMotion,
  circuit: circuitBasic,
  resistor: circuitBasic,
  ohm: circuitBasic,
  voltage: circuitBasic,
  current: circuitBasic,
  battery: circuitBasic,
};

export function findPreset(topic: string): SceneData | null {
  const lower = topic.toLowerCase();
  for (const [kw, scene] of Object.entries(presetKeywords)) {
    if (lower.includes(kw)) return scene;
  }
  return null;
}

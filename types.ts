
export type PatternType = 
  | 'terrain' | 'tunnel' | 'swarm' | 'grid' | 'pillars' 
  | 'plasma' | 'matrix' | 'lattice' | 'glitch' | 'starfield'
  | 'vortex' | 'cubes' | 'waves' | 'rings' | 'blobs'
  | 'scanlines' | 'fractal' | 'feedback' | 'noise' | 'void';

export interface VisualState {
  intensity: number;
  bpm: number;
  kick: number;
  low: number;
  mid: number;
  high: number;
  worldview: string;
  primaryPattern: PatternType;
  secondaryPattern: PatternType | 'none';
  overlayOpacity: number;
  autoMode: boolean;
  cameraSpeed: number;
  theme: {
    hue: number;
    noiseScale: number;
    distortion: number;
    glitch: number;
  };
}

export type ViewMode = 'output' | 'control';

export interface AudioStats {
  bpm: number;
  low: number;
  mid: number;
  high: number;
  isKick: boolean;
  state: string;
}


import { VisualState } from '../types';

const CHANNEL_NAME = 'norke_vj_sync';
const channel = new BroadcastChannel(CHANNEL_NAME);

export const defaultState: VisualState = {
  intensity: 1.0,
  bpm: 128,
  kick: 0,
  low: 0,
  mid: 0,
  high: 0,
  worldview: 'ruined futurism',
  primaryPattern: 'terrain',
  secondaryPattern: 'none',
  overlayOpacity: 0.5,
  autoMode: false,
  cameraSpeed: 1.0,
  theme: {
    hue: 0.6,
    noiseScale: 1.0,
    distortion: 0.2,
    glitch: 0.1,
  }
};

export const syncState = (state: VisualState) => {
  channel.postMessage(state);
};

export const onSync = (callback: (state: VisualState) => void) => {
  const listener = (event: MessageEvent) => {
    callback(event.data);
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
  };
};

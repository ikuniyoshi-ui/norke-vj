
import { AudioStats } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private kickThreshold = 0.45;
  private lastKickTime = 0;
  private bpmHistory: number[] = [];

  async init() {
    try {
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.resume();
        return true;
      }

      // Fix: Removed 'latency' constraint as it is not present in standard MediaTrackConstraints for audio inputs.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive'
      });
      
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.5;
      
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      await this.audioContext.resume();
      console.log("Audio Engine Active. State:", this.audioContext.state);
      return true;
    } catch (e) {
      console.error('Audio initialization failed', e);
      return false;
    }
  }

  getStats(sensitivity: number = 1.0): AudioStats {
    const defaultStats = { bpm: 128, low: 0, mid: 0, high: 0, isKick: false, state: this.audioContext?.state || 'null' };
    
    if (!this.analyser || !this.dataArray || !this.audioContext) return defaultStats;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const low = Math.min(1.0, (this.getAverage(0, 8) / 255) * sensitivity);
    const mid = Math.min(1.0, (this.getAverage(9, 60) / 255) * sensitivity);
    const high = Math.min(1.0, (this.getAverage(61, 200) / 255) * sensitivity);

    const now = performance.now();
    let isKick = false;
    if (low > this.kickThreshold && now - this.lastKickTime > 220) {
      isKick = true;
      const interval = now - this.lastKickTime;
      if (interval > 300 && interval < 800) {
        this.bpmHistory.push(interval);
        if (this.bpmHistory.length > 12) this.bpmHistory.shift();
      }
      this.lastKickTime = now;
    }

    let bpm = 128;
    if (this.bpmHistory.length > 4) {
      const avgInterval = this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
      bpm = Math.round(60000 / avgInterval);
    }

    return { bpm, low, mid, high, isKick, state: this.audioContext.state };
  }

  private getAverage(start: number, end: number): number {
    if (!this.dataArray) return 0;
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += this.dataArray[i];
    }
    return sum / (end - start + 1);
  }
}

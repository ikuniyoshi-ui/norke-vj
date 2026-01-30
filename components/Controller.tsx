import React, { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../services/audioEngine';
import { VisualState, AudioStats, PatternType } from '../types';
import { defaultState, syncState } from '../services/visualState';
import { GoogleGenAI, Type } from '@google/genai';
import { Key, Sparkles, Home, ChevronRight, ExternalLink, Activity, Cpu } from 'lucide-react';
import Visualizer from './Visualizer';

const PATTERNS: PatternType[] = [
  'terrain', 'tunnel', 'swarm', 'grid', 'pillars', 
  'plasma', 'matrix', 'lattice', 'glitch', 'starfield',
  'vortex', 'cubes', 'waves', 'rings', 'blobs',
  'scanlines', 'fractal', 'feedback', 'noise', 'void'
];

const Controller: React.FC = () => {
  // --- APIキー管理用のステート ---
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('VJ_GEMINI_API_KEY') || '');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(!!localStorage.getItem('VJ_GEMINI_API_KEY'));
  
  const [state, setState] = useState<VisualState>(defaultState);
  const [audioActive, setAudioActive] = useState(false);
  const [stats, setStats] = useState<AudioStats | null>(null);
  const [worldInput, setWorldInput] = useState(defaultState.worldview);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.1);//オーディオ感度調整
  const audioEngine = useRef(new AudioEngine());
  const autoTimer = useRef<number | null>(null);

  const handleSaveKey = () => {
    if (apiKey.trim().length > 10) {
      localStorage.setItem('VJ_GEMINI_API_KEY', apiKey.trim());
      setIsKeySaved(true);
    } else {
      alert("正しいAPIキーを入力してください。");
    }
  };

  const handleStartAudio = async () => {
    const success = await audioEngine.current.init();
    if (success) setAudioActive(true);
  };

  useEffect(() => {
    if (!audioActive) return;
    const interval = setInterval(() => {
      const newStats = audioEngine.current.getStats(sensitivity);
      setStats(newStats);
      setState(prev => {
        const newState = {
          ...prev,
          bpm: newStats.bpm,
          low: newStats.low,
          mid: newStats.mid,
          high: newStats.high,
          kick: newStats.isKick ? 1.0 : prev.kick * 0.9,
        };
        syncState(newState);
        return newState;
      });
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [audioActive, sensitivity]);

  useEffect(() => {
    if (state.autoMode && audioActive) {
      const triggerRandom = () => {
        const pri = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
        let sec: PatternType | 'none' = 'none';
        if (Math.random() > 0.3) {
           sec = PATTERNS.filter(p => p !== pri)[Math.floor(Math.random() * (PATTERNS.length - 1))];
        }
        
        setState(prev => ({
          ...prev,
          primaryPattern: pri,
          secondaryPattern: sec,
          overlayOpacity: 0.2 + Math.random() * 0.6,
          cameraSpeed: 0.3 + Math.random() * 1.2,
          theme: {
            ...prev.theme,
            hue: Math.random(),
            noiseScale: 0.5 + Math.random() * 2.0
          }
        }));
      };

      triggerRandom();
      autoTimer.current = window.setInterval(triggerRandom, 10000);
    } else {
      if (autoTimer.current) clearInterval(autoTimer.current);
    }
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [state.autoMode, audioActive]);

  const updateWorldview = async () => {
    if (!worldInput.trim() || !apiKey) return;
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `VJ Setup for: "${worldInput}". Define: hue (0-1), primaryPattern, secondaryPattern (or 'none'). 
        Choices: ${PATTERNS.join(', ')}. Return JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hue: { type: Type.NUMBER },
              primaryPattern: { type: Type.STRING },
              secondaryPattern: { type: Type.STRING }
            },
            required: ['hue', 'primaryPattern']
          }
        }
      });
      const data = JSON.parse(response.text);
      setState(prev => ({
        ...prev,
        theme: { ...prev.theme, hue: data.hue },
        primaryPattern: data.primaryPattern as PatternType,
        secondaryPattern: (data.secondaryPattern || 'none') as any,
        autoMode: false
      }));
    } catch (e) { 
      console.error(e);
      alert("AI連携でエラーが発生しました。APIキーが正しいか確認してください。");
    } finally { 
      setIsProcessing(false); 
    }
  };

  // --- APIキー未設定時の初期画面 ---
  if (!isKeySaved) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full border border-zinc-800 p-10 bg-zinc-900/30 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          <Key className="mx-auto mb-8 text-cyan-500 animate-pulse" size={48} />
          <h2 className="text-2xl font-black tracking-tighter uppercase mb-2 text-center">Engine Access Required</h2>
          <p className="text-[10px] text-zinc-500 text-center mb-8 uppercase tracking-[0.3em]">Initialize generative VJ core</p>
          
          <div className="space-y-6">
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="GEMINI API KEY"
                className="w-full bg-black border border-zinc-800 p-4 text-xs font-mono text-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-800"
              />
            </div>
            
            <button 
              onClick={handleSaveKey} 
              className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all active:scale-95"
            >
              Start Core Engine
            </button>
            
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 hover:text-white uppercase tracking-widest transition-colors"
            >
              Get New API Key <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- メイン UI ---
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-black min-h-screen text-zinc-100 selection:bg-cyan-500 selection:text-black">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-8 gap-4">
        <div>
          <h1 className="text-7xl font-black tracking-tighter italic leading-none text-white">norké VJ System</h1>
          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.7em] mt-4 font-black">Generative Sync Engine // v2.9</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setState(p => ({ ...p, autoMode: !p.autoMode }))}
            className={`px-10 py-4 border-2 font-black text-xs tracking-[0.4em] uppercase transition-all flex items-center gap-4 ${state.autoMode ? 'bg-white border-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'border-zinc-800 text-zinc-700 hover:border-zinc-400'}`}
          >
            {state.autoMode ? 'GENERATIVE AUTO: ON' : 'AUTO MODE: OFF'}
          </button>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 px-6 flex flex-col justify-center">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${audioActive ? 'bg-cyan-500 animate-pulse' : 'bg-red-600'}`} />
               <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">{audioActive ? 'Stream Linked' : 'No Input'}</span>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-video w-full bg-black border border-zinc-900 shadow-2xl relative overflow-hidden ring-1 ring-zinc-800/50">
            <Visualizer manualState={state} />
            {!audioActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/98 backdrop-blur-xl z-30">
                <button onClick={handleStartAudio} className="px-20 py-8 bg-white text-black font-black uppercase tracking-[0.6em] transition-all hover:tracking-[0.8em] hover:bg-cyan-400">
                  Boot Engine
                </button>
              </div>
            )}
            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md p-2 px-4 border border-zinc-800 font-mono text-[10px] text-cyan-500">
              PRI: {state.primaryPattern} / SEC: {state.secondaryPattern}
            </div>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-900 p-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-700 mb-8 border-l-2 border-zinc-800 pl-4">Primary Oscillator Matrix</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {PATTERNS.map(p => (
                <button 
                  key={p} 
                  onClick={() => setState(s => ({ ...s, primaryPattern: p, autoMode: false }))}
                  className={`aspect-square text-[9px] font-mono uppercase transition-all flex items-center justify-center border ${state.primaryPattern === p ? 'bg-cyan-500 border-cyan-400 text-black font-bold' : 'bg-black border-zinc-800 text-zinc-700 hover:border-zinc-500 hover:text-white'}`}
                >
                  {p.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-900 p-8 space-y-8">
            <div className="space-y-4">
              <label className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <span>Overlay Mix (B)</span>
                <span className="text-cyan-500 font-mono">{Math.round(state.overlayOpacity * 100)}%</span>
              </label>
              <select 
                value={state.secondaryPattern}
                onChange={e => setState(s => ({ ...s, secondaryPattern: e.target.value as any, autoMode: false }))}
                className="w-full bg-black border border-zinc-800 p-4 text-xs font-mono text-zinc-400 focus:outline-none focus:border-cyan-500 rounded-none appearance-none"
              >
                <option value="none">--- DISCONNECTED ---</option>
                {PATTERNS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={state.overlayOpacity}
                onChange={e => setState(s => ({ ...s, overlayOpacity: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-cyan-500" 
              />
            </div>

            <div className="pt-8 border-t border-zinc-800 space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Synthesizer Prompt</label>
              <textarea 
                value={worldInput}
                onChange={e => setWorldInput(e.target.value)}
                placeholder="Deep sea neural interface..."
                className="w-full h-32 bg-black border border-zinc-800 p-5 text-sm font-light focus:outline-none focus:border-cyan-900 resize-none text-white rounded-none placeholder:text-zinc-800"
              />
              <button 
                disabled={isProcessing || !audioActive}
                onClick={updateWorldview}
                className="w-full py-6 bg-zinc-800 text-white font-black text-xs tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all disabled:opacity-10"
              >
                {isProcessing ? 'Thinking...' : 'Sync Aesthetics'}
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900 p-8 space-y-8">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-zinc-700 tracking-[0.3em] uppercase">Audio Analytics</span>
               <span className="font-mono text-xs text-cyan-400">{stats?.bpm || '--'} BPM</span>
             </div>
             
             <div className="space-y-6">
               <VUMeter label="SUB/LOW" value={state.low} color="bg-cyan-500" active={state.kick > 0.6} />
               <VUMeter label="MID/DRUM" value={state.mid} color="bg-zinc-500" />
               <VUMeter label="HIGH/SYN" value={state.high} color="bg-zinc-700" />
             </div>

             <div className="pt-6 border-t border-zinc-800 space-y-3">
               <div className="flex justify-between text-[9px] font-black text-zinc-800 uppercase">
                 <span>Input Sensitivity</span>
                 <span>{sensitivity.toFixed(1)}x</span>
               </div>
               <input 
                 //入力感度スライダーの範囲調整
                  type="range" min="0.1" max="3.0" step="0.1" 
                  value={sensitivity}
                  onChange={e => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-zinc-500" 
                />
             </div>
          </div>

          {/* Master Output Controls */}
          <div className="bg-zinc-900/40 border border-zinc-900 p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Camera Velocity</label>
                <span className="text-[10px] font-mono text-cyan-500">{state.cameraSpeed.toFixed(2)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.01" 
                value={state.cameraSpeed} 
                onChange={e => {
                  const speed = parseFloat(e.target.value);
                  setState(prev => ({ ...prev, cameraSpeed: speed }));
                  syncState({ ...state, cameraSpeed: speed });
                }} 
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-white" 
              />
              <div className="flex justify-between text-[8px] text-zinc-800 font-mono">
                <span>SLOW (0.1)</span>
                <span>FAST (2.0)</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Master Opacity</label>
                <span className="text-[10px] font-mono text-white">{Math.round(state.intensity * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1.5" step="0.01" 
                value={state.intensity} 
                onChange={e => {
                  const intensity = parseFloat(e.target.value);
                  setState(prev => ({ ...prev, intensity }));
                  syncState({ ...state, intensity });
                }} 
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-cyan-500" 
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="pt-20 pb-12 flex flex-col md:flex-row justify-between text-[10px] text-zinc-800 font-mono tracking-[0.5em] uppercase border-t border-zinc-900 gap-6">
        <div className="flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-cyan-500" />
            <span>norké_vj_core // cinema_update_active</span>
          </div>
          <div className="opacity-30 flex items-center gap-2">
            <Cpu size={12} />
            <span>gl_context: webgl2 // sync_rate: 60hz</span>
          </div>
        </div>
        <div className="flex gap-12 items-center">
          <div className="flex gap-6">
            <span>LATENCY: 11MS</span>
            <span className="text-zinc-700">CPU_L: NORMAL</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { localStorage.removeItem('VJ_GEMINI_API_KEY'); window.location.reload(); }} 
              className="text-zinc-800 hover:text-red-500 transition-colors underline underline-offset-4"
            >
              Reset Key
            </button>
            <a href="#output" target="_blank" className="text-zinc-700 hover:text-white transition-colors underline decoration-zinc-900 underline-offset-8">EXT_PROJECTOR ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const VUMeter: React.FC<{ label: string, value: number, color: string, active?: boolean }> = ({ label, value, color, active }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[8px] font-black font-mono text-zinc-800">
      <span className={active ? "text-white" : ""}>{label}</span>
      <span className={active ? "text-cyan-500" : ""}>{Math.round(value * 100)}</span>
    </div>
    <div className="h-0.5 w-full bg-zinc-900">
      <div 
        className={`h-full ${color} transition-all duration-75 ${active ? 'brightness-150 shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}`} 
        style={{ width: `${Math.min(100, value * 100)}%` }} 
      />
    </div>
  </div>
);

export default Controller;

import React, { useState, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import Controller from './components/Controller';
import { ViewMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('control');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'output') {
        setMode('output');
      } else {
        setMode('control');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    // 修正: min-h-screen ではなく h-screen にして画面の高さを確定させます
    <main className="h-screen w-screen overflow-hidden bg-black">
      {mode === 'output' ? (
        <Visualizer />
      ) : (
        <div className="bg-[#050505] min-h-screen text-zinc-100">
          <Controller />
        </div>
      )}
    </main>
  );
};

export default App;

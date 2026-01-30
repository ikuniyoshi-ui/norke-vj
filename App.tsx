
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
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <main className="min-h-screen">
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

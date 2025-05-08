import React from 'react';
import { GridProvider } from './state/GridContext';
import { AlgorithmProvider } from './state/AlgorithmContext';
import { VisualizationProvider } from './state/VisualizationContext';
import { InteractionProvider } from './state/InteractionContext';
import Toolbar from './components/controls/Toolbar';
import Legend from './components/controls/Legend';
import Grid from './components/grid/Grid';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Component to apply keyboard shortcuts
const KeyboardShortcutsHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useKeyboardShortcuts();
  return <>{children}</>;
};

function App() {
  return (
    <div className="app flex flex-col h-screen">
      <header className="bg-purple-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Pathfinding Visualizer</h1>
      </header>
      
      <GridProvider>
        <VisualizationProvider>
          <AlgorithmProvider>
            <InteractionProvider>
              <KeyboardShortcutsHandler>
                <main className="flex-1 flex flex-col overflow-hidden">
                  <Toolbar />
                  <Grid />
                  <Legend />
                </main>
              </KeyboardShortcutsHandler>
            </InteractionProvider>
          </AlgorithmProvider>
        </VisualizationProvider>
      </GridProvider>
      
      <footer className="bg-gray-100 p-3 text-center text-gray-500 text-sm border-t">
        <p>Pathfinding Visualizer - Built with React and TypeScript</p>
      </footer>
    </div>
  );
}

export default App;

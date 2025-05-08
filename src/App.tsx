import React from 'react';
import { GridProvider } from './state/GridContext';
import { AlgorithmProvider } from './state/AlgorithmContext';
import { VisualizationProvider } from './state/VisualizationContext';
import { InteractionProvider } from './state/InteractionContext';
import MazeVisualizer from './components/MazeVisualizer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Component to apply keyboard shortcuts
const KeyboardShortcutsHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useKeyboardShortcuts();
  return <>{children}</>;
};

function App() {
  return (
    <div className="app flex flex-col h-screen">
      
      <GridProvider>
        <VisualizationProvider>
          <AlgorithmProvider>
            <InteractionProvider>
              <KeyboardShortcutsHandler>
                <MazeVisualizer />
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

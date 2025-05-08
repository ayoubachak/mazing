import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AlgorithmEngine } from '../core/AlgorithmEngine';
import type { AlgorithmResult } from '../core/AlgorithmEngine';
import { useGrid } from './GridContext';
import { useVisualization } from './VisualizationContext';
import { eventBus, EVENTS } from '../core/EventBus';
import type { NodePosition } from '../core/GridModel';

// Algorithm types
export enum AlgorithmType {
  DIJKSTRA = 'dijkstra',
  A_STAR = 'astar',
  BFS = 'bfs',
  DFS = 'dfs'
}

// Context interface
interface AlgorithmContextValue {
  // Algorithm state
  selectedAlgorithm: AlgorithmType;
  isRunning: boolean;
  lastResult: AlgorithmResult | null;
  
  // Algorithm actions
  setAlgorithm: (algorithm: AlgorithmType) => void;
  runAlgorithm: () => void;
  stopAlgorithm: () => void;
  
  // Algorithm engine reference
  algorithmEngine: AlgorithmEngine;
}

// Create the context
export const AlgorithmContext = createContext<AlgorithmContextValue | undefined>(undefined);

// Provider component
export const AlgorithmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get grid and visualization contexts
  const { grid, gridModel, startNode, finishNode, foodNodes } = useGrid();
  const { visualize, stopVisualization, clearVisualization, visualizationState } = useVisualization();
  
  // Create the algorithm engine once
  const algorithmEngine = useMemo(() => {
    return new AlgorithmEngine(grid);
  }, [grid]);
  
  // React state for algorithm
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>(AlgorithmType.DIJKSTRA);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<AlgorithmResult | null>(null);
  
  // Update algorithm engine's grid when it changes
  useEffect(() => {
    algorithmEngine.updateGrid(grid);
  }, [algorithmEngine, grid]);
  
  // Subscribe to algorithm events from the event bus
  useEffect(() => {
    const completedUnsubscribe = eventBus.subscribe(EVENTS.ALGORITHM_COMPLETED, (data: AlgorithmResult) => {
      setLastResult(data);
      setIsRunning(false);
      
      // Start visualization when algorithm completes
      visualize(data);
    });
    
    const algorithmChangedUnsubscribe = eventBus.subscribe(EVENTS.ALGORITHM_CHANGED, (data) => {
      setSelectedAlgorithm(data.algorithm);
    });
    
    return () => {
      completedUnsubscribe();
      algorithmChangedUnsubscribe();
    };
  }, [visualize]);
  
  // Set algorithm type
  const setAlgorithm = (algorithm: AlgorithmType) => {
    setSelectedAlgorithm(algorithm);
    eventBus.publish(EVENTS.ALGORITHM_CHANGED, { algorithm });
  };
  
  // Run algorithm
  const runAlgorithm = () => {
    if (isRunning) return;
    
    clearVisualization();
    setIsRunning(true);
    
    // Execute the appropriate algorithm
    let result: AlgorithmResult;
    
    try {
      switch (selectedAlgorithm) {
        case AlgorithmType.DIJKSTRA:
          result = algorithmEngine.runDijkstra(startNode, finishNode, foodNodes);
          break;
        case AlgorithmType.A_STAR:
          result = algorithmEngine.runAStar(startNode, finishNode, foodNodes);
          break;
        case AlgorithmType.BFS:
          result = algorithmEngine.runBFS(startNode, finishNode, foodNodes);
          break;
        case AlgorithmType.DFS:
          result = algorithmEngine.runDFS(startNode, finishNode, foodNodes);
          break;
        default:
          result = algorithmEngine.runDijkstra(startNode, finishNode, foodNodes);
      }
      
      setLastResult(result);
      
      // Start visualization
      visualize(result);
    } catch (error) {
      console.error('Error running algorithm:', error);
      setIsRunning(false);
    }
  };
  
  // Stop algorithm and visualization
  const stopAlgorithm = () => {
    setIsRunning(false);
    stopVisualization();
  };
  
  // Create context value
  const contextValue: AlgorithmContextValue = {
    selectedAlgorithm,
    isRunning,
    lastResult,
    setAlgorithm,
    runAlgorithm,
    stopAlgorithm,
    algorithmEngine
  };
  
  return (
    <AlgorithmContext.Provider value={contextValue}>
      {children}
    </AlgorithmContext.Provider>
  );
};

// Custom hook for using the algorithm context
export const useAlgorithm = (): AlgorithmContextValue => {
  const context = useContext(AlgorithmContext);
  if (context === undefined) {
    throw new Error('useAlgorithm must be used within an AlgorithmProvider');
  }
  return context;
}; 
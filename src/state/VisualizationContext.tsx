import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  VisualizationEngine, 
  VisualizationState, 
  AnimationSpeed 
} from '../core/VisualizationEngine';
import type { GridNode } from '../core/GridModel';
import type { AlgorithmResult } from '../core/AlgorithmEngine';
import { eventBus, EVENTS } from '../core/EventBus';

// Context interface
interface VisualizationContextValue {
  // Visualization state
  visualizationState: VisualizationState;
  speed: AnimationSpeed;
  progress: {
    visitedProgress: number;
    visitedTotal: number;
    shortestPathProgress: number;
    shortestPathTotal: number;
  };
  
  // Visualization actions
  setSpeed: (speed: AnimationSpeed) => void;
  visualize: (result: AlgorithmResult) => void;
  pauseVisualization: () => void;
  stopVisualization: () => void;
  clearVisualization: () => void;
  
  // Visualization engine reference
  visualizationEngine: VisualizationEngine;
}

// Create the context
export const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

// Provider component
export const VisualizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create the visualization engine once
  const visualizationEngine = useMemo(() => {
    return new VisualizationEngine({ speed: AnimationSpeed.MEDIUM });
  }, []);
  
  // React state to trigger re-renders when visualization changes
  const [visualizationState, setVisualizationState] = useState<VisualizationState>(VisualizationState.IDLE);
  const [speed, setSpeedState] = useState<AnimationSpeed>(AnimationSpeed.MEDIUM);
  const [progress, setProgress] = useState({
    visitedProgress: 0,
    visitedTotal: 0,
    shortestPathProgress: 0,
    shortestPathTotal: 0
  });
  
  // Subscribe to visualization events from the event bus
  useEffect(() => {
    const startedUnsubscribe = eventBus.subscribe(EVENTS.VISUALIZATION_STARTED, () => {
      setVisualizationState(VisualizationState.RUNNING);
    });
    
    const stoppedUnsubscribe = eventBus.subscribe(EVENTS.VISUALIZATION_STOPPED, (data) => {
      setVisualizationState(data.state || VisualizationState.IDLE);
      
      if (data.visitedProgress !== undefined && data.shortestPathProgress !== undefined) {
        setProgress(prev => ({
          ...prev,
          visitedProgress: data.visitedProgress,
          shortestPathProgress: data.shortestPathProgress
        }));
      }
    });
    
    const completedUnsubscribe = eventBus.subscribe(EVENTS.VISUALIZATION_COMPLETED, () => {
      setVisualizationState(VisualizationState.COMPLETED);
      
      // Update progress to completed
      setProgress(prev => ({
        ...prev,
        visitedProgress: prev.visitedTotal,
        shortestPathProgress: prev.shortestPathTotal
      }));
    });
    
    const stepUnsubscribe = eventBus.subscribe(EVENTS.VISUALIZATION_STEP, (data) => {
      if (data.type === 'visited') {
        setProgress(prev => ({
          ...prev,
          visitedProgress: data.index + 1,
          visitedTotal: data.total
        }));
      } else if (data.type === 'shortest') {
        setProgress(prev => ({
          ...prev,
          shortestPathProgress: data.index + 1,
          shortestPathTotal: data.total
        }));
      }
    });
    
    return () => {
      startedUnsubscribe();
      stoppedUnsubscribe();
      completedUnsubscribe();
      stepUnsubscribe();
    };
  }, []);
  
  // Set animation speed
  const setSpeed = (newSpeed: AnimationSpeed) => {
    visualizationEngine.setSpeed(newSpeed);
    setSpeedState(newSpeed);
    eventBus.publish(EVENTS.ANIMATION_SPEED_CHANGED, { speed: newSpeed });
  };
  
  // Start visualization with algorithm results
  const visualize = (result: AlgorithmResult) => {
    visualizationEngine.setAlgorithmResults(
      result.visitedNodesInOrder, 
      result.nodesInShortestPathOrder
    );
    setProgress({
      visitedProgress: 0,
      visitedTotal: result.visitedNodesInOrder.length,
      shortestPathProgress: 0,
      shortestPathTotal: result.nodesInShortestPathOrder.length
    });
    visualizationEngine.start();
  };
  
  // Pause the visualization
  const pauseVisualization = () => {
    visualizationEngine.pause();
  };
  
  // Stop the visualization
  const stopVisualization = () => {
    visualizationEngine.stop();
  };
  
  // Clear the visualization
  const clearVisualization = () => {
    visualizationEngine.clearVisualization();
    setProgress({
      visitedProgress: 0,
      visitedTotal: 0,
      shortestPathProgress: 0,
      shortestPathTotal: 0
    });
    setVisualizationState(VisualizationState.IDLE);
  };
  
  // Create context value
  const contextValue: VisualizationContextValue = {
    visualizationState,
    speed,
    progress,
    setSpeed,
    visualize,
    pauseVisualization,
    stopVisualization,
    clearVisualization,
    visualizationEngine
  };
  
  return (
    <VisualizationContext.Provider value={contextValue}>
      {children}
    </VisualizationContext.Provider>
  );
};

// Custom hook for using the visualization context
export const useVisualization = (): VisualizationContextValue => {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
}; 
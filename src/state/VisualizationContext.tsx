import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  VisualizationEngine, 
  VisualizationState, 
  AnimationSpeed 
} from '../core/VisualizationEngine';
import type { GridNode } from '../core/GridModel';
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
  startVisualization: (visitedNodesInOrder: GridNode[], nodesInShortestPathOrder: GridNode[]) => void;
  pauseVisualization: () => void;
  stopVisualization: () => void;
  resetVisualization: () => void;
  
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
  
  // Create a ref to track current visualization state without causing re-renders
  const visualizationStateRef = useRef(visualizationState);
  
  // Update ref when state changes
  useEffect(() => {
    visualizationStateRef.current = visualizationState;
  }, [visualizationState]);
  
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
    
    // Subscribe to node movement events to update visualization
    const nodeMovedUnsubscribe = eventBus.subscribe(EVENTS.NODE_MOVED, () => {
      // Use the ref to check the current state instead of depending on visualizationState
      const currentState = visualizationStateRef.current;
      
      // Only update visualization if it's completed or idle
      if (currentState === VisualizationState.COMPLETED ||
          currentState === VisualizationState.IDLE) {
        eventBus.publish(EVENTS.RECALCULATE_PATH_REQUESTED);
      }
    });
    
    return () => {
      startedUnsubscribe();
      stoppedUnsubscribe();
      completedUnsubscribe();
      stepUnsubscribe();
      nodeMovedUnsubscribe();
    };
  }, []); // Remove visualizationState from dependencies
  
  // Set animation speed
  const setSpeed = (newSpeed: AnimationSpeed) => {
    visualizationEngine.setSpeed(newSpeed);
    setSpeedState(newSpeed);
    eventBus.publish(EVENTS.ANIMATION_SPEED_CHANGED, { speed: newSpeed });
  };
  
  // Start visualization with algorithm results
  const startVisualization = useCallback((visitedNodesInOrder: GridNode[], nodesInShortestPathOrder: GridNode[]) => {
    // Don't call resetVisualization() here as it can trigger state updates that cause re-renders
    // Instead, directly control the visualization engine
    
    // Stop any current visualization
    visualizationEngine.stop();
    visualizationEngine.clearVisualization();
    
    // Set algorithm results and prepare for animation
    visualizationEngine.setAlgorithmResults(visitedNodesInOrder, nodesInShortestPathOrder);
    
    // Update progress state in one batch to reduce renders
    setProgress({
      visitedProgress: 0,
      visitedTotal: visitedNodesInOrder.length,
      shortestPathProgress: 0,
      shortestPathTotal: nodesInShortestPathOrder.length
    });
    
    // Make sure state is updated before starting animation
    setTimeout(() => {
      visualizationEngine.start();
    }, 50);
  }, [visualizationEngine]);
  
  // Pause the visualization
  const pauseVisualization = () => {
    visualizationEngine.pause();
  };
  
  // Stop the visualization
  const stopVisualization = useCallback(() => {
    // Check if we're already stopped to prevent unnecessary event cycles
    if (visualizationState === VisualizationState.IDLE) {
      return;
    }
    
    visualizationEngine.stop();
  }, [visualizationEngine, visualizationState]);
  
  // Reset the visualization state
  const resetVisualization = useCallback(() => {
    // Check if we're already in IDLE state to prevent unnecessary state updates
    if (visualizationState === VisualizationState.IDLE) {
      return;
    }
    
    stopVisualization();
    visualizationEngine.clearVisualization();
    visualizationEngine.reset();
    
    setProgress({
      visitedProgress: 0,
      visitedTotal: 0,
      shortestPathProgress: 0,
      shortestPathTotal: 0
    });
    
    setVisualizationState(VisualizationState.IDLE);
  }, [visualizationEngine, stopVisualization, visualizationState]);
  
  // Create context value
  const contextValue: VisualizationContextValue = {
    visualizationState,
    speed,
    progress,
    setSpeed,
    startVisualization,
    pauseVisualization,
    stopVisualization,
    resetVisualization,
    visualizationEngine
  };
  
  return (
    <VisualizationContext.Provider value={contextValue}>
      {children}
    </VisualizationContext.Provider>
  );
};

// Custom hook for using the visualization context
export const useVisualizationContext = () => {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualizationContext must be used within a VisualizationProvider');
  }
  return context;
}; 
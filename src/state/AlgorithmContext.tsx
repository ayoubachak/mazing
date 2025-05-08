import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { runDijkstra, runAStar, runBFS, runDFS } from '../algorithms/pathfinding';
import { useGridContext } from './GridContext';
import { useVisualizationContext } from './VisualizationContext';
import { eventBus, EVENTS } from '../core/EventBus';

interface AlgorithmContextType {
  algorithm: string;
  setAlgorithm: (algorithm: string) => void;
  runSelectedAlgorithm: () => void;
  isCalculating: boolean;
}

const AlgorithmContext = createContext<AlgorithmContextType | undefined>(undefined);

export const AlgorithmProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [isCalculating, setIsCalculating] = useState(false);
  const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(true);
  
  // Use a ref to track calculating state without triggering effect re-runs
  const isCalculatingRef = useRef(isCalculating);
  
  // Update ref when state changes
  useEffect(() => {
    isCalculatingRef.current = isCalculating;
  }, [isCalculating]);
  
  const { grid, startNode, finishNode, foodNodes } = useGridContext();
  const { startVisualization, resetVisualization, visualizationState } = useVisualizationContext();
  
  // Helper function to run algorithm and get results
  const calculatePath = useCallback(() => {
    if (!grid || isCalculatingRef.current) return null;

    console.log('AlgorithmContext: Calculating path using', algorithm);
    
    // Get the start and finish nodes from the grid
    const startNodeObj = grid[startNode.row][startNode.col];
    const finishNodeObj = grid[finishNode.row][finishNode.col];
    
    let result;
    try {
      switch (algorithm) {
        case 'dijkstra':
          console.log('Running Dijkstra with', startNodeObj, finishNodeObj, foodNodes);
          result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
          break;
        case 'astar':
          result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes);
          break;
        case 'bfs':
          result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes);
          break;
        case 'dfs':
          result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes);
          break;
        default:
          result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
      }
      
      console.log('AlgorithmContext: Path calculation result', {
        algorithm,
        visitedNodes: result ? result.visitedNodesInOrder.length : 0,
        shortestPath: result ? result.nodesInShortestPathOrder.length : 0
      });
      
      return result;
    } catch (error) {
      console.error('Algorithm error:', error);
      return null;
    }
  }, [algorithm, grid, startNode, finishNode, foodNodes]);
  
  // Function to run algorithm with visualization
  const runSelectedAlgorithm = useCallback(() => {
    if (!grid || isCalculating) {
      console.log('AlgorithmContext: Cannot run - grid missing or already calculating');
      return;
    }
    
    console.log('AlgorithmContext: Running selected algorithm:', algorithm);
    setIsCalculating(true);
    resetVisualization();
    
    // Small timeout to ensure the UI is updated before starting the algorithm
    setTimeout(() => {
      try {
        const result = calculatePath();
        
        if (result && result.visitedNodesInOrder.length > 0) {
          console.log('AlgorithmContext: Starting visualization with', 
            result.visitedNodesInOrder.length, 'visited nodes and',
            result.nodesInShortestPathOrder.length, 'shortest path nodes');
          
          // Show a warning if we have visited nodes but no path was found
          if (result.nodesInShortestPathOrder.length === 0) {
            console.warn('AlgorithmContext: Nodes were visited but no valid path to destination was found');
            // Continue with visualization to show explored areas
          }
          
          // Use another timeout to ensure DOM updates have time to complete
          setTimeout(() => {
            startVisualization(result.visitedNodesInOrder, result.nodesInShortestPathOrder);
            // Use a timeout to set isCalculating to false after visualization has started
            setTimeout(() => {
              setIsCalculating(false);
            }, 100);
          }, 50);
        } else {
          console.warn('AlgorithmContext: No valid path found or algorithm returned no results');
          setIsCalculating(false);
        }
      } catch (error) {
        console.error('AlgorithmContext: Error running algorithm:', error);
        setIsCalculating(false);
      }
    }, 100);
  }, [grid, isCalculating, resetVisualization, calculatePath, startVisualization, algorithm]);
  
  // Subscribe to path update requests
  useEffect(() => {
    const pathUpdateSubscribe = eventBus.subscribe(EVENTS.PATH_UPDATED, () => {
      if (enableRealTimeUpdates) {
        // Only execute if we're not already calculating 
        // and if visualization is not actively running
        if (!isCalculatingRef.current) {
          const result = calculatePath();
          if (result && result.visitedNodesInOrder.length > 0) {
            startVisualization(result.visitedNodesInOrder, result.nodesInShortestPathOrder);
          }
        }
      }
    });
    
    return () => {
      pathUpdateSubscribe();
    };
  }, [enableRealTimeUpdates, calculatePath, startVisualization]);
  
  // When algorithm changes, reset visualization
  // Using a ref to track if this is the first render
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    // Skip the reset on the first render to prevent infinite loops
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    resetVisualization();
  }, [algorithm, resetVisualization]);
  
  return (
    <AlgorithmContext.Provider value={{
      algorithm,
      setAlgorithm,
      runSelectedAlgorithm,
      isCalculating
    }}>
      {children}
    </AlgorithmContext.Provider>
  );
};

export const useAlgorithmContext = () => {
  const context = useContext(AlgorithmContext);
  if (context === undefined) {
    throw new Error('useAlgorithmContext must be used within an AlgorithmProvider');
  }
  return context;
}; 
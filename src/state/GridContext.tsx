import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { GridModel } from '../core/GridModel';
import type { GridNode, NodePosition } from '../core/GridModel';
import { eventBus, EVENTS } from '../core/EventBus';

// Initial grid settings
const INITIAL_ROWS = 25;
const INITIAL_COLS = 40;
const INITIAL_START_NODE = { row: 10, col: 10 };
const INITIAL_FINISH_NODE = { row: 10, col: 30 };

// Context interface
interface GridContextValue {
  // Grid data
  grid: GridNode[][];
  rows: number;
  cols: number;
  startNode: NodePosition;
  finishNode: NodePosition;
  foodNodes: NodePosition[];
  
  // Grid actions
  setStartNode: (row: number, col: number) => void;
  setFinishNode: (row: number, col: number) => void;
  toggleWall: (row: number, col: number) => void;
  toggleFood: (row: number, col: number) => void;
  toggleWeight: (row: number, col: number) => void;
  clearWallsAndWeights: () => void;
  clearPath: () => void;
  clearBoard: () => void;
  resize: (rows: number, cols: number) => void;
  
  // Grid model reference
  gridModel: GridModel;
}

// Create the context
export const GridContext = createContext<GridContextValue | undefined>(undefined);

// Provider component
export const GridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create the grid model once
  const gridModel = useMemo(() => {
    return new GridModel(
      INITIAL_ROWS,
      INITIAL_COLS,
      INITIAL_START_NODE,
      INITIAL_FINISH_NODE
    );
  }, []);
  
  // React state to trigger re-renders when grid changes
  const [grid, setGrid] = useState<GridNode[][]>(gridModel.getGrid());
  const [rows, setRows] = useState<number>(INITIAL_ROWS);
  const [cols, setCols] = useState<number>(INITIAL_COLS);
  const [startNode, setStartNodeState] = useState<NodePosition>(INITIAL_START_NODE);
  const [finishNode, setFinishNodeState] = useState<NodePosition>(INITIAL_FINISH_NODE);
  const [foodNodes, setFoodNodes] = useState<NodePosition[]>([]);
  
  // Use a ref to track the debounce timer
  const recalculationTimerRef = useRef<number | null>(null);
  
  // Subscribe to grid changes from the event bus
  useEffect(() => {
    const gridInitializedUnsubscribe = eventBus.subscribe(EVENTS.GRID_INITIALIZED, (data) => {
      setGrid([...data.grid]);
    });
    
    const nodeChangedUnsubscribe = eventBus.subscribe(EVENTS.GRID_NODE_CHANGED, () => {
      // When a node changes, we update the entire grid in React state to trigger re-render
      setGrid([...gridModel.getGrid()]);
      
      // Also update food nodes
      setFoodNodes([...gridModel.getFoodNodes()]);
    });
    
    // Subscribe to path recalculation requests
    const recalculateUnsubscribe = eventBus.subscribe(EVENTS.RECALCULATE_PATH_REQUESTED, () => {
      // Clear any existing timer
      if (recalculationTimerRef.current !== null) {
        window.clearTimeout(recalculationTimerRef.current);
      }
      
      // Debounce the path recalculation to prevent rapid firing
      recalculationTimerRef.current = window.setTimeout(() => {
        // Trigger path recalculation based on current grid state
        eventBus.publish(EVENTS.PATH_UPDATED, {
          grid: gridModel.getGrid(),
          startNode: gridModel.getStartNode(),
          finishNode: gridModel.getFinishNode(),
          foodNodes: gridModel.getFoodNodes()
        });
        
        recalculationTimerRef.current = null;
      }, 200); // 200ms debounce
    });
    
    return () => {
      gridInitializedUnsubscribe();
      nodeChangedUnsubscribe();
      recalculateUnsubscribe();
      
      // Clean up any pending timer
      if (recalculationTimerRef.current !== null) {
        window.clearTimeout(recalculationTimerRef.current);
      }
    };
  }, [gridModel]);
  
  // Grid actions
  const setStartNode = (row: number, col: number) => {
    // Skip if coordinates are out of bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    // Skip if trying to place at the finish node position
    if (row === finishNode.row && col === finishNode.col) return;
    
    // Skip if trying to place on a wall
    if (grid[row][col].isWall) return;
    
    // Skip if position hasn't changed
    if (row === startNode.row && col === startNode.col) return;
    
    const oldStartNode = {...startNode};
    gridModel.setStartNode(row, col);
    const newStartNode = gridModel.getStartNode();
    setStartNodeState(newStartNode);
    
    // Emit node moved event to trigger algorithm recalculation
    eventBus.publish(EVENTS.NODE_MOVED, {
      type: 'start',
      from: oldStartNode,
      to: newStartNode
    });
  };
  
  const setFinishNode = (row: number, col: number) => {
    // Skip if coordinates are out of bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    // Skip if trying to place at the start node position
    if (row === startNode.row && col === startNode.col) return;
    
    // Skip if trying to place on a wall
    if (grid[row][col].isWall) return;
    
    // Skip if position hasn't changed
    if (row === finishNode.row && col === finishNode.col) return;
    
    const oldFinishNode = {...finishNode};
    gridModel.setFinishNode(row, col);
    const newFinishNode = gridModel.getFinishNode();
    setFinishNodeState(newFinishNode);
    
    // Emit node moved event to trigger algorithm recalculation
    eventBus.publish(EVENTS.NODE_MOVED, {
      type: 'finish',
      from: oldFinishNode,
      to: newFinishNode
    });
  };
  
  const toggleWall = (row: number, col: number) => {
    // Skip if coordinates are out of bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    // Skip if trying to toggle wall on start or finish nodes
    if ((row === startNode.row && col === startNode.col) || 
        (row === finishNode.row && col === finishNode.col)) {
      return;
    }
    
    gridModel.toggleWall(row, col);
  };
  
  const toggleFood = (row: number, col: number) => {
    // Skip if coordinates are out of bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    // Skip if trying to toggle food on start, finish, or wall nodes
    if ((row === startNode.row && col === startNode.col) || 
        (row === finishNode.row && col === finishNode.col) ||
        grid[row][col].isWall) {
      return;
    }
    
    gridModel.toggleFood(row, col);
    
    // After toggling food, emit node moved event to trigger recalculation
    eventBus.publish(EVENTS.NODE_MOVED, {
      type: 'food',
      foodNodes: gridModel.getFoodNodes()
    });
  };
  
  const toggleWeight = (row: number, col: number) => {
    // Skip if coordinates are out of bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    // Skip if trying to toggle weight on start, finish, wall, or food nodes
    if ((row === startNode.row && col === startNode.col) || 
        (row === finishNode.row && col === finishNode.col) ||
        grid[row][col].isWall ||
        grid[row][col].isFood) {
      return;
    }
    
    gridModel.toggleWeight(row, col);
  };
  
  const clearWallsAndWeights = () => {
    gridModel.clearWallsAndWeights();
  };
  
  const clearPath = () => {
    gridModel.clearVisualization();
  };
  
  const clearBoard = () => {
    gridModel.clearAll();
    setFoodNodes([]);
  };
  
  const resize = (newRows: number, newCols: number) => {
    gridModel.resize(newRows, newCols);
    setRows(newRows);
    setCols(newCols);
    setStartNodeState(gridModel.getStartNode());
    setFinishNodeState(gridModel.getFinishNode());
    setFoodNodes(gridModel.getFoodNodes());
  };
  
  // Create context value
  const contextValue: GridContextValue = {
    grid,
    rows,
    cols,
    startNode,
    finishNode,
    foodNodes,
    setStartNode,
    setFinishNode,
    toggleWall,
    toggleFood,
    toggleWeight,
    clearWallsAndWeights,
    clearPath,
    clearBoard,
    resize,
    gridModel
  };
  
  return (
    <GridContext.Provider value={contextValue}>
      {children}
    </GridContext.Provider>
  );
};

// Custom hook for using the grid context
export const useGridContext = (): GridContextValue => {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return context;
}; 
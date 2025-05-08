import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
    
    return () => {
      gridInitializedUnsubscribe();
      nodeChangedUnsubscribe();
    };
  }, [gridModel]);
  
  // Grid actions
  const setStartNode = (row: number, col: number) => {
    gridModel.setStartNode(row, col);
    setStartNodeState(gridModel.getStartNode());
  };
  
  const setFinishNode = (row: number, col: number) => {
    gridModel.setFinishNode(row, col);
    setFinishNodeState(gridModel.getFinishNode());
  };
  
  const toggleWall = (row: number, col: number) => {
    gridModel.toggleWall(row, col);
  };
  
  const toggleFood = (row: number, col: number) => {
    gridModel.toggleFood(row, col);
  };
  
  const toggleWeight = (row: number, col: number) => {
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
export const useGrid = (): GridContextValue => {
  const context = useContext(GridContext);
  if (context === undefined) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
}; 
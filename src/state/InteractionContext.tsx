import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGridContext } from './GridContext';
import { eventBus, EVENTS } from '../core/EventBus';

// Tool types
export enum ToolType {
  WALL = 'wall',
  WEIGHT = 'weight',
  FOOD = 'food',
  ERASER = 'eraser',
  START = 'start',
  FINISH = 'finish'
}

// Interaction states
export enum InteractionState {
  IDLE = 'idle',
  DRAWING = 'drawing',
  ERASING = 'erasing',
  DRAGGING_START = 'dragging_start',
  DRAGGING_FINISH = 'dragging_finish'
}

// Context interface
interface InteractionContextValue {
  // Interaction state
  currentTool: ToolType;
  interactionState: InteractionState;
  isMousePressed: boolean;
  
  // Interaction actions
  setTool: (tool: ToolType) => void;
  handleNodeMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  handleNodeMouseEnter: (row: number, col: number) => void;
  handleNodeMouseUp: () => void;
  handleGridMouseLeave: () => void;
  
  // Grid panning and zooming
  isPanning: boolean;
  zoomLevel: number;
  panOffset: { x: number, y: number };
  handlePanStart: (e: React.MouseEvent) => void;
  handlePanMove: (e: React.MouseEvent) => void;
  handlePanEnd: () => void;
  handleZoom: (e: React.WheelEvent) => void;
  resetView: () => void;
}

// Create the context
export const InteractionContext = createContext<InteractionContextValue | undefined>(undefined);

// Provider component
export const InteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get grid context
  const { 
    toggleWall, 
    toggleWeight, 
    toggleFood, 
    setStartNode, 
    setFinishNode,
    startNode,
    finishNode,
    grid
  } = useGridContext();
  
  // React state for interaction
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.WALL);
  const [interactionState, setInteractionState] = useState<InteractionState>(InteractionState.IDLE);
  const [isMousePressed, setIsMousePressed] = useState<boolean>(false);
  
  // State for panning and zooming
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  // Set the current tool
  const setTool = (tool: ToolType) => {
    setCurrentTool(tool);
    eventBus.publish(EVENTS.TOOL_CHANGED, { tool });
  };
  
  // Handle mouse down on a node
  const handleNodeMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    // Prevent default only for dragging operations
    if (grid?.[row]?.[col]?.isStart || grid?.[row]?.[col]?.isFinish) {
      e.preventDefault();
    }
    
    setIsMousePressed(true);
    
    const node = grid?.[row]?.[col];
    if (!node) return;
    
    // Handle start and finish node dragging
    if (node.isStart) {
      setInteractionState(InteractionState.DRAGGING_START);
      return;
    }
    
    if (node.isFinish) {
      setInteractionState(InteractionState.DRAGGING_FINISH);
      return;
    }
    
    // Handle tool actions
    applyToolAction(row, col);
    
    // Set interaction state based on tool and current node
    if (currentTool === ToolType.ERASER) {
      setInteractionState(InteractionState.ERASING);
    } else {
      setInteractionState(InteractionState.DRAWING);
    }
    
    // Publish event
    eventBus.publish(EVENTS.NODE_CLICKED, { row, col, tool: currentTool });
  };
  
  // Handle mouse enter on a node
  const handleNodeMouseEnter = (row: number, col: number) => {
    if (!isMousePressed) return;
    
    // Handle dragging start or finish nodes
    if (interactionState === InteractionState.DRAGGING_START) {
      setStartNode(row, col);
      return;
    }
    
    if (interactionState === InteractionState.DRAGGING_FINISH) {
      setFinishNode(row, col);
      return;
    }
    
    // Handle drawing or erasing
    if (interactionState === InteractionState.DRAWING || interactionState === InteractionState.ERASING) {
      applyToolAction(row, col);
    }
    
    // Publish event
    eventBus.publish(EVENTS.NODE_DRAGGED, { row, col, tool: currentTool });
  };
  
  // Handle mouse up
  const handleNodeMouseUp = () => {
    setIsMousePressed(false);
    setInteractionState(InteractionState.IDLE);
  };
  
  // Handle mouse leave from grid
  const handleGridMouseLeave = () => {
    setIsMousePressed(false);
    setInteractionState(InteractionState.IDLE);
  };
  
  // Apply tool action based on current tool
  const applyToolAction = (row: number, col: number) => {
    switch (currentTool) {
      case ToolType.WALL:
        toggleWall(row, col);
        break;
      case ToolType.WEIGHT:
        toggleWeight(row, col);
        break;
      case ToolType.FOOD:
        toggleFood(row, col);
        break;
      case ToolType.ERASER:
        // Apply eraser action - check node type and clear it
        const node = grid?.[row]?.[col];
        if (node?.isWall) toggleWall(row, col);
        else if (node?.isWeight) toggleWeight(row, col);
        else if (node?.isFood) toggleFood(row, col);
        break;
      case ToolType.START:
        setStartNode(row, col);
        break;
      case ToolType.FINISH:
        setFinishNode(row, col);
        break;
    }
  };
  
  // Pan and zoom functions
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    
    setPanOffset({
      x: panOffset.x + dx,
      y: panOffset.y + dy
    });
    
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  const handleZoom = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prevZoom => {
      const newZoom = prevZoom * zoomFactor;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };
  
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  
  // Create context value
  const contextValue: InteractionContextValue = {
    currentTool,
    interactionState,
    isMousePressed,
    setTool,
    handleNodeMouseDown,
    handleNodeMouseEnter,
    handleNodeMouseUp,
    handleGridMouseLeave,
    isPanning,
    zoomLevel,
    panOffset,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    handleZoom,
    resetView
  };
  
  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  );
};

// Custom hook for using the interaction context
export const useInteractionContext = (): InteractionContextValue => {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error('useInteractionContext must be used within an InteractionProvider');
  }
  return context;
}; 
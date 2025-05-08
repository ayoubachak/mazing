import React, { memo } from 'react';
import { Home, Target, Circle, Weight } from 'lucide-react';
import type { GridNode } from '../../core/GridModel';
import { useInteraction } from '../../state/InteractionContext';

interface NodeProps {
  node: GridNode;
  size?: number;
}

const Node: React.FC<NodeProps> = ({ node, size = 24 }) => {
  const {
    handleNodeMouseDown,
    handleNodeMouseEnter,
    handleNodeMouseUp
  } = useInteraction();
  
  const {
    row,
    col,
    isStart,
    isFinish,
    isWall,
    isVisited,
    isShortest,
    isFood,
    isWeight
  } = node;

  // Determine the CSS classes based on the node's state
  const getNodeClassName = () => {
    // Always include 'node' class for CSS animations to work
    const baseClass = "node border border-gray-300 flex items-center justify-center transition-all duration-300 select-none";
    let classes = baseClass;
    
    // Add state-specific classes
    if (isStart) classes += " bg-gradient-to-br from-purple-600 to-purple-800 cursor-grab";
    else if (isFinish) classes += " bg-gradient-to-br from-purple-800 to-purple-950 cursor-grab";
    else if (isWall) classes += " bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner";
    else if (isFood) classes += " bg-gradient-to-br from-yellow-300 to-yellow-500";
    else if (isWeight) classes += " bg-gradient-to-br from-blue-200 to-blue-400";
    else classes += " bg-white hover:bg-gray-100";
    
    // These classes will be applied by the VisualizationEngine, but we'll initialize them if the state is already set
    if (isShortest) classes += " node-shortest-path";
    else if (isVisited) classes += " node-visited";
    
    return classes;
  };
  
  return (
    <div
      id={`node-${row}-${col}`}
      className={getNodeClassName()}
      style={{ 
        width: `${size}px`, 
        height: `${size}px` 
      }}
      onMouseDown={(e) => handleNodeMouseDown(row, col, e)}
      onMouseEnter={() => handleNodeMouseEnter(row, col)}
      onMouseUp={handleNodeMouseUp}
      onDragStart={(e) => e.preventDefault()}
      data-testid={`node-${row}-${col}`}
      role="gridcell"
      data-row={row}
      data-col={col}
      data-state={
        isStart ? "start" :
        isFinish ? "finish" :
        isFood ? "food" :
        isWall ? "wall" :
        isWeight ? "weight" :
        isVisited ? "visited" :
        isShortest ? "shortest" :
        "unvisited"
      }
      aria-label={
        isStart ? "Start node" :
        isFinish ? "Target node" :
        isFood ? "Food node" :
        isWall ? "Wall node" :
        isWeight ? "Weight node" :
        "Empty node"
      }
    >
      {isStart && <div className="text-white"><Home size={size * 0.6} strokeWidth={2.5} /></div>}
      {isFinish && <div className="text-white"><Target size={size * 0.6} strokeWidth={2.5} /></div>}
      {isFood && <div className="text-yellow-800"><Circle size={size * 0.6} strokeWidth={2.5} /></div>}
      {isWeight && <div className="text-blue-800"><Weight size={size * 0.6} strokeWidth={2.5} /></div>}
    </div>
  );
};

export default memo(Node); 
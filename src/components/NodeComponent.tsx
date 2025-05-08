import React, { useEffect } from 'react';
import { Home, Target, Circle, Weight } from 'lucide-react';
import type { NodeProps, GridNode } from './types';

// Removing memo to ensure component re-renders when node properties change
const NodeComponent: React.FC<NodeProps> = ({ node, onMouseDown, onMouseEnter, onMouseUp }) => {
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

  // Log when nodes become visited or shortest path for debugging
  useEffect(() => {
    if (isVisited) {
      console.log(`Node [${row},${col}] is now marked as visited`);
    }
    if (isShortest) {
      console.log(`Node [${row},${col}] is now marked as shortest path`);
    }
  }, [isVisited, isShortest, row, col]);

  // Determine the CSS classes based on the node's state
  const getNodeClassName = () => {
    const baseClass = "node w-6 h-6 border border-gray-300 flex items-center justify-center transition-all duration-300 select-none";
    
    if (isStart) return `${baseClass} bg-gradient-to-br from-purple-600 to-purple-800 cursor-grab`;
    if (isFinish) return `${baseClass} bg-gradient-to-br from-purple-800 to-purple-950 cursor-grab`;
    if (isWall) return `${baseClass} bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner animate-pulse-fast`;
    if (isFood) return `${baseClass} bg-gradient-to-br from-yellow-300 to-yellow-500`;
    if (isWeight) return `${baseClass} bg-gradient-to-br from-blue-200 to-blue-400`;
    if (isShortest) return `${baseClass} node-shortest-path bg-yellow-300`;
    if (isVisited) return `${baseClass} node-visited bg-cyan-400`;
    
    return `${baseClass} bg-white hover:bg-gray-100`;
  };

  const className = getNodeClassName();
  
  return (
    <div
      id={`node-${row}-${col}`}
      className={className}
      onMouseDown={(e) => {
        // Only use preventDefault for drag operations, not for all clicks
        if (isStart || isFinish) {
          e.preventDefault();
        }
        onMouseDown(row, col, e);
      }}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={onMouseUp}
      onDragStart={(e) => e.preventDefault()}
      data-testid={`node-${row}-${col}`}
      role="gridcell"
      aria-label={
        isStart ? "Start node" :
        isFinish ? "Target node" :
        isFood ? "Food node" :
        isWall ? "Wall node" :
        isWeight ? "Weight node" :
        "Empty node"
      }
    >
      {isStart && <div className="text-white"><Home size={15} strokeWidth={2.5} /></div>}
      {isFinish && <div className="text-white"><Target size={15} strokeWidth={2.5} /></div>}
      {isFood && <div className="text-yellow-800"><Circle size={15} strokeWidth={2.5} /></div>}
      {isWeight && <div className="text-blue-800"><Weight size={15} strokeWidth={2.5} /></div>}
    </div>
  );
};

export default NodeComponent; 
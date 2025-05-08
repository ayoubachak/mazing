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
    const baseClass = "node border border-gray-300 flex items-center justify-center transition-all duration-300 select-none";
    
    if (isStart) return `${baseClass} bg-gradient-to-br from-purple-600 to-purple-800 cursor-grab`;
    if (isFinish) return `${baseClass} bg-gradient-to-br from-purple-800 to-purple-950 cursor-grab`;
    if (isWall) return `${baseClass} bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner`;
    if (isFood) return `${baseClass} bg-gradient-to-br from-yellow-300 to-yellow-500`;
    if (isWeight) return `${baseClass} bg-gradient-to-br from-blue-200 to-blue-400`;
    if (isShortest) return `${baseClass} node-shortest-path bg-yellow-300`;
    if (isVisited) return `${baseClass} node-visited bg-cyan-400`;
    
    return `${baseClass} bg-white hover:bg-gray-100`;
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
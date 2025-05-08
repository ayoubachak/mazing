import React, { useRef } from 'react';
import { useGrid } from '../../state/GridContext';
import { useInteraction } from '../../state/InteractionContext';
import Node from '../nodes/Node';

interface GridProps {
  nodeSize?: number;
  gap?: number;
}

const Grid: React.FC<GridProps> = ({ 
  nodeSize = 24, 
  gap = 1 
}) => {
  const { grid, rows, cols } = useGrid();
  const { 
    handlePanStart, 
    handlePanMove, 
    handlePanEnd, 
    handleZoom, 
    handleGridMouseLeave,
    isPanning, 
    zoomLevel, 
    panOffset 
  } = useInteraction();
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      className="grid-container overflow-auto bg-gray-100"
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
        position: 'relative',
        height: 'calc(100vh - 160px)',
        width: '100%',
        overflow: 'auto'
      }}
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={() => {
        handlePanEnd();
        handleGridMouseLeave();
      }}
      onWheel={handleZoom}
      ref={gridRef}
    >
      <div 
        className="grid-content"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, ${nodeSize}px)`,
          gridTemplateColumns: `repeat(${cols}, ${nodeSize}px)`,
          gap: `${gap}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transition: isPanning ? 'none' : 'transform 0.05s ease',
          transformOrigin: 'center',
          padding: '20px',
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        {grid.map((row, rowIdx) => (
          row.map((node, nodeIdx) => (
            <Node 
              key={`node-${node.row}-${node.col}`} 
              node={node} 
              size={nodeSize}
            />
          ))
        ))}
      </div>
    </div>
  );
};

export default Grid; 
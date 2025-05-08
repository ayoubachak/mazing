import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface TooltipProps {
  content: string;
  position: { x: number; y: number };
  onClose?: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ content, position, onClose }) => {
  const [offset, setOffset] = useState({ x: 15, y: 15 });
  
  // Adjust tooltip position to ensure it stays within viewport
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = 250; // Approximate width of tooltip
      const tooltipHeight = 60; // Approximate height of tooltip
      
      // Adjust horizontal position
      if (position.x + tooltipWidth + offset.x > viewportWidth) {
        setOffset(prev => ({ ...prev, x: -tooltipWidth - 15 }));
      } else {
        setOffset(prev => ({ ...prev, x: 15 }));
      }
      
      // Adjust vertical position
      if (position.y + tooltipHeight + offset.y > viewportHeight) {
        setOffset(prev => ({ ...prev, y: -tooltipHeight - 15 }));
      } else {
        setOffset(prev => ({ ...prev, y: 15 }));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);
  
  return (
    <div 
      className="absolute z-50 bg-gray-800 text-white text-sm rounded px-3 py-2 shadow-lg max-w-xs"
      style={{
        left: `${position.x + offset.x}px`,
        top: `${position.y + offset.y}px`,
        opacity: 0.95,
        transition: 'opacity 0.15s'
      }}
      role="tooltip"
    >
      {onClose && (
        <button 
          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl rounded-tr hover:bg-red-600 transition-colors"
          onClick={onClose}
          aria-label="Close tooltip"
        >
          <X size={14} />
        </button>
      )}
      <div className="pr-5 pt-1">
        {content}
      </div>
    </div>
  );
};

export default Tooltip; 
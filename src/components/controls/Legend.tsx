import React from 'react';
import { Home, Target, Circle, Weight, Square, ArrowRight } from 'lucide-react';

const Legend: React.FC = () => {
  const legendItems = [
    { name: 'Start Node', icon: <Home size={16} className="text-white" />, color: 'bg-gradient-to-br from-purple-600 to-purple-800' },
    { name: 'Target Node', icon: <Target size={16} className="text-white" />, color: 'bg-gradient-to-br from-purple-800 to-purple-950' },
    { name: 'Food Node', icon: <Circle size={16} className="text-yellow-800" />, color: 'bg-gradient-to-br from-yellow-300 to-yellow-500' },
    { name: 'Wall Node', icon: <Square size={16} className="text-gray-900" />, color: 'bg-gradient-to-br from-gray-700 to-gray-900' },
    { name: 'Weight Node', icon: <Weight size={16} className="text-blue-800" />, color: 'bg-gradient-to-br from-blue-200 to-blue-400' },
    { name: 'Visited Node', icon: null, color: 'bg-cyan-400' },
    { name: 'Shortest Path', icon: <ArrowRight size={16} className="text-yellow-800" />, color: 'bg-yellow-300' },
  ];

  return (
    <div className="legend bg-white shadow-md p-3 border-t border-gray-100">
      <div className="flex flex-wrap gap-4 items-center justify-center">
        {legendItems.map((item) => (
          <div key={item.name} className="flex items-center gap-1">
            <div
              className={`${item.color} w-5 h-5 rounded-sm flex items-center justify-center shadow-sm`}
            >
              {item.icon}
            </div>
            <span className="text-sm text-gray-700">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend; 
import React from 'react';
import { Home, Target, Circle, Weight, Square } from 'lucide-react';

const Legend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center bg-gray-200 py-2 px-4 gap-4 text-sm border-b border-gray-300">
      <div className="flex items-center">
        <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-purple-800 mr-2 flex items-center justify-center rounded-sm">
          <Home size={12} className="text-white" />
        </div>
        <span>Start</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-gradient-to-br from-purple-800 to-purple-950 mr-2 flex items-center justify-center rounded-sm">
          <Target size={12} className="text-white" />
        </div>
        <span>Target</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-white border border-gray-300 mr-2"></div>
        <span>Unvisited Node</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-cyan-400 mr-2"></div>
        <span>Visited Node</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-yellow-300 mr-2"></div>
        <span>Shortest Path</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-gradient-to-br from-gray-700 to-gray-900 mr-2 flex items-center justify-center rounded-sm">
          <Square size={12} className="text-white" />
        </div>
        <span>Wall</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-gradient-to-br from-yellow-300 to-yellow-500 mr-2 flex items-center justify-center rounded-sm">
          <Circle size={12} className="text-yellow-800" />
        </div>
        <span>Food (Waypoint)</span>
      </div>
      
      <div className="flex items-center">
        <div className="w-5 h-5 bg-gradient-to-br from-blue-200 to-blue-400 mr-2 flex items-center justify-center rounded-sm">
          <Weight size={12} className="text-blue-800" />
        </div>
        <span>Weight</span>
      </div>
    </div>
  );
};

export default Legend; 
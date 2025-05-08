import React from 'react';
import { ChevronDown, Square, Weight, Circle, Edit, Info } from 'lucide-react';
import type { ToolbarProps } from './types';

const Toolbar: React.FC<ToolbarProps> = ({ 
  isMenuOpen,
  algorithm,
  setAlgorithm,
  currentTool,
  setCurrentTool,
  clearBoard,
  clearWallsAndWeights,
  clearPath,
  speed,
  setSpeed,
  generateMaze,
  onShowTooltip,
  onHideTooltip
}) => {
  if (!isMenuOpen) return null;

  // Tooltip content for different elements
  const tooltips = {
    algorithms: {
      dijkstra: "Guarantees the shortest path. Explores all directions equally, prioritizing nodes closest to the start.",
      astar: "Uses heuristics to find the shortest path more efficiently than Dijkstra's by favoring paths that seem to lead toward the goal.",
      bfs: "Explores all neighbors at the current depth before moving to nodes at the next depth level.",
      dfs: "Explores as far as possible along each branch before backtracking. Does not guarantee the shortest path."
    },
    tools: {
      wall: "Click or drag to add/remove walls that block all paths",
      food: "Add waypoints that the algorithm will visit before reaching the target",
      weight: "Add weighted areas that are more costly to traverse (algorithms will try to avoid them)",
      eraser: "Remove walls, weights, and food nodes"
    },
    mazes: {
      random: "Generate a maze with randomly placed walls",
      recursiveDivision: "Generate a more structured maze using recursive division algorithm"
    },
    speed: {
      fast: "Run the animation at high speed",
      medium: "Run the animation at medium speed",
      slow: "Run the animation at slow speed"
    },
    clear: {
      board: "Clear everything: walls, weights, food, and paths",
      wallsWeights: "Clear only walls and weights, keeping start/end points and food",
      path: "Clear only the previously animated path"
    }
  };

  const handleShowToolTip = (content: string, e: React.MouseEvent) => {
    if (onShowTooltip) {
      onShowTooltip(content, e);
    }
  };

  const handleHideToolTip = () => {
    if (onHideTooltip) {
      onHideTooltip();
    }
  };
  
  return (
    <div className="bg-gray-700 text-white p-3 flex flex-wrap items-center gap-3">
      {/* Algorithm selection */}
      <div className="group relative">
        <button 
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md flex items-center transition-colors shadow-sm"
          onMouseEnter={(e) => handleShowToolTip("Select a pathfinding algorithm", e)}
          onMouseLeave={handleHideToolTip}
        >
          <span className="mr-2 font-medium">Algorithm: {algorithm === "astar" ? "A*" : 
            algorithm === "dijkstra" ? "Dijkstra" : 
            algorithm === "bfs" ? "BFS" : "DFS"}</span>
          <ChevronDown size={16} />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-600 mt-1 py-1 rounded-md shadow-lg z-10 w-64">
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${algorithm === 'dijkstra' ? 'bg-gray-500' : ''}`}
            onClick={() => setAlgorithm('dijkstra')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.algorithms.dijkstra, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Dijkstra's Algorithm</span>
            {algorithm === 'dijkstra' && <span className="text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${algorithm === 'astar' ? 'bg-gray-500' : ''}`}
            onClick={() => setAlgorithm('astar')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.algorithms.astar, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>A* Search</span>
            {algorithm === 'astar' && <span className="text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${algorithm === 'bfs' ? 'bg-gray-500' : ''}`}
            onClick={() => setAlgorithm('bfs')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.algorithms.bfs, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Breadth-First Search</span>
            {algorithm === 'bfs' && <span className="text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${algorithm === 'dfs' ? 'bg-gray-500' : ''}`}
            onClick={() => setAlgorithm('dfs')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.algorithms.dfs, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Depth-First Search</span>
            {algorithm === 'dfs' && <span className="text-green-400">✓</span>}
          </button>
        </div>
      </div>
      
      {/* Maze selection */}
      <div className="group relative">
        <button 
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md flex items-center transition-colors shadow-sm"
          onMouseEnter={(e) => handleShowToolTip("Generate a maze pattern", e)}
          onMouseLeave={handleHideToolTip}
        >
          <span className="mr-2 font-medium">Mazes</span>
          <ChevronDown size={16} />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-600 mt-1 py-1 rounded-md shadow-lg z-10 w-52">
          <button 
            className="block px-4 py-2 hover:bg-gray-500 w-full text-left transition-colors"
            onClick={() => generateMaze('random')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.mazes.random, e)}
            onMouseLeave={handleHideToolTip}
          >
            Random Maze
          </button>
          <button 
            className="block px-4 py-2 hover:bg-gray-500 w-full text-left transition-colors"
            onClick={() => generateMaze('recursiveDivision')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.mazes.recursiveDivision, e)}
            onMouseLeave={handleHideToolTip}
          >
            Recursive Division
          </button>
        </div>
      </div>
      
      {/* Drawing tools */}
      <div className="group relative">
        <button 
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md flex items-center transition-colors shadow-sm"
          onMouseEnter={(e) => handleShowToolTip("Select a drawing tool", e)}
          onMouseLeave={handleHideToolTip}
        >
          <span className="mr-2 font-medium">Tool: {
            currentTool === 'wall' ? 'Wall' :
            currentTool === 'food' ? 'Food' :
            currentTool === 'weight' ? 'Weight' : 'Eraser'
          }</span>
          <ChevronDown size={16} />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-600 mt-1 py-1 rounded-md shadow-lg z-10 w-52">
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex items-center transition-colors ${currentTool === 'wall' ? 'bg-gray-500' : ''}`}
            onClick={() => setCurrentTool('wall')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.tools.wall, e)}
            onMouseLeave={handleHideToolTip}
          >
            <Square size={18} className="mr-3" /> <span>Wall</span>
            {currentTool === 'wall' && <span className="ml-auto text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex items-center transition-colors ${currentTool === 'weight' ? 'bg-gray-500' : ''}`}
            onClick={() => setCurrentTool('weight')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.tools.weight, e)}
            onMouseLeave={handleHideToolTip}
          >
            <Weight size={18} className="mr-3" /> <span>Weight</span>
            {currentTool === 'weight' && <span className="ml-auto text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex items-center transition-colors ${currentTool === 'food' ? 'bg-gray-500' : ''}`}
            onClick={() => setCurrentTool('food')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.tools.food, e)}
            onMouseLeave={handleHideToolTip}
          >
            <Circle size={18} className="mr-3" /> <span>Food</span>
            {currentTool === 'food' && <span className="ml-auto text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex items-center transition-colors ${currentTool === 'eraser' ? 'bg-gray-500' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.tools.eraser, e)}
            onMouseLeave={handleHideToolTip}
          >
            <Edit size={18} className="mr-3" /> <span>Eraser</span>
            {currentTool === 'eraser' && <span className="ml-auto text-green-400">✓</span>}
          </button>
        </div>
      </div>
      
      {/* Speed selection */}
      <div className="group relative">
        <button 
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md flex items-center transition-colors shadow-sm"
          onMouseEnter={(e) => handleShowToolTip("Set animation speed", e)}
          onMouseLeave={handleHideToolTip}
        >
          <span className="mr-2 font-medium">Speed: {speed.charAt(0).toUpperCase() + speed.slice(1)}</span>
          <ChevronDown size={16} />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-600 mt-1 py-1 rounded-md shadow-lg z-10 w-44">
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${speed === 'fast' ? 'bg-gray-500' : ''}`}
            onClick={() => setSpeed('fast')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.speed.fast, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Fast</span>
            {speed === 'fast' && <span className="text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${speed === 'medium' ? 'bg-gray-500' : ''}`}
            onClick={() => setSpeed('medium')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.speed.medium, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Medium</span>
            {speed === 'medium' && <span className="text-green-400">✓</span>}
          </button>
          <button 
            className={`block px-4 py-2 hover:bg-gray-500 w-full text-left flex justify-between items-center transition-colors ${speed === 'slow' ? 'bg-gray-500' : ''}`}
            onClick={() => setSpeed('slow')}
            onMouseEnter={(e) => handleShowToolTip(tooltips.speed.slow, e)}
            onMouseLeave={handleHideToolTip}
          >
            <span>Slow</span>
            {speed === 'slow' && <span className="text-green-400">✓</span>}
          </button>
        </div>
      </div>
      
      {/* Divider */}
      <div className="h-8 border-l border-gray-500 mx-1"></div>
      
      {/* Clear buttons */}
      <button
        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
        onClick={clearBoard}
        onMouseEnter={(e) => handleShowToolTip(tooltips.clear.board, e)}
        onMouseLeave={handleHideToolTip}
      >
        Clear Board
      </button>
      <button
        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
        onClick={clearWallsAndWeights}
        onMouseEnter={(e) => handleShowToolTip(tooltips.clear.wallsWeights, e)}
        onMouseLeave={handleHideToolTip}
      >
        Clear Walls & Weights
      </button>
      <button
        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
        onClick={clearPath}
        onMouseEnter={(e) => handleShowToolTip(tooltips.clear.path, e)}
        onMouseLeave={handleHideToolTip}
      >
        Clear Path
      </button>
    </div>
  );
};

export default Toolbar; 
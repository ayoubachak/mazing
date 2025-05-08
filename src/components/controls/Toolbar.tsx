import React from 'react';
import { 
  ChevronDown, Zap, Play, Pause, RefreshCw, Grid, 
  Map, Edit, Square, Target, Circle, ArrowRight, 
  Weight, X, Home
} from 'lucide-react';
import { useAlgorithmContext } from '../../state/AlgorithmContext';
import { useVisualizationContext } from '../../state/VisualizationContext';
import { AnimationSpeed, VisualizationState } from '../../core/VisualizationEngine';
import { useGridContext } from '../../state/GridContext';
import { useInteractionContext, ToolType } from '../../state/InteractionContext';

const Toolbar: React.FC = () => {
  const { 
    algorithm, 
    setAlgorithm, 
    runSelectedAlgorithm, 
    isCalculating 
  } = useAlgorithmContext();
  
  const { 
    visualizationState, 
    speed, 
    setSpeed,
    pauseVisualization,
    stopVisualization,
    resetVisualization
  } = useVisualizationContext();
  
  const { 
    clearWallsAndWeights, 
    clearPath, 
    clearBoard,
    gridModel
  } = useGridContext();
  
  const { currentTool, setTool, resetView } = useInteractionContext();
  
  const algorithmNames = {
    'dijkstra': "Dijkstra's Algorithm",
    'astar': "A* Search",
    'bfs': "Breadth-First Search",
    'dfs': "Depth-First Search"
  };

  // Speed options for visualization
  const speeds = [
    { name: 'Slow', value: AnimationSpeed.SLOW },
    { name: 'Medium', value: AnimationSpeed.MEDIUM },
    { name: 'Fast', value: AnimationSpeed.FAST }
  ];
  
  // Handle visualization button click
  const handleVisualize = () => {
    console.log('Toolbar: handleVisualize clicked, current state:', visualizationState);
    
    if (
      visualizationState === VisualizationState.RUNNING ||
      visualizationState === VisualizationState.PAUSED
    ) {
      console.log('Toolbar: Stopping algorithm');
      stopVisualization();
      resetVisualization();
    } else {
      console.log('Toolbar: Running algorithm:', algorithm);
      clearPath();
      
      // Execute with small timeout to ensure UI updates first
      setTimeout(() => {
        runSelectedAlgorithm();
      }, 50);
    }
  };
  
  // Handle pause button click
  const handlePause = () => {
    if (visualizationState === VisualizationState.RUNNING) {
      pauseVisualization();
    } else if (visualizationState === VisualizationState.PAUSED) {
      runSelectedAlgorithm();
    }
  };
  
  return (
    <div className="toolbar bg-white shadow-md p-3 flex flex-wrap gap-2 items-center">
      {/* Algorithm Selection */}
      <div className="dropdown relative inline-block">
        <button className="bg-white border border-gray-300 px-4 py-2 rounded-md text-sm flex items-center gap-1 hover:bg-gray-50">
          {algorithmNames[algorithm] || 'Select Algorithm'} <ChevronDown size={16} />
        </button>
        <div className="dropdown-content absolute hidden bg-white border border-gray-200 mt-1 p-1 rounded-md z-10 shadow-lg">
          {Object.entries(algorithmNames).map(([type, name]) => (
            <button
              key={type}
              className={`block px-4 py-2 text-sm rounded hover:bg-gray-100 w-full text-left ${
                algorithm === type ? 'bg-gray-100' : ''
              }`}
              onClick={() => setAlgorithm(type)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Controls */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${
            visualizationState === VisualizationState.RUNNING
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
          onClick={handleVisualize}
          disabled={isCalculating}
        >
          {visualizationState === VisualizationState.RUNNING ? (
            <>
              <X size={16} /> Stop
            </>
          ) : (
            <>
              <Play size={16} /> Visualize
            </>
          )}
        </button>
        
        <button
          className={`px-3 py-2 rounded-md text-sm flex items-center gap-1 ${
            visualizationState === VisualizationState.RUNNING || visualizationState === VisualizationState.PAUSED 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handlePause}
          disabled={
            visualizationState !== VisualizationState.RUNNING && 
            visualizationState !== VisualizationState.PAUSED
          }
        >
          {visualizationState === VisualizationState.PAUSED ? (
            <>
              <Play size={16} /> Resume
            </>
          ) : (
            <>
              <Pause size={16} /> Pause
            </>
          )}
        </button>
      </div>

      {/* Speed Control */}
      <div className="dropdown relative inline-block">
        <button className="bg-white border border-gray-300 px-4 py-2 rounded-md text-sm flex items-center gap-1 hover:bg-gray-50">
          <Zap size={16} /> 
          {speed === AnimationSpeed.SLOW ? 'Slow' : 
           speed === AnimationSpeed.MEDIUM ? 'Medium' : 'Fast'} 
          <ChevronDown size={16} />
        </button>
        <div className="dropdown-content absolute hidden bg-white border border-gray-200 mt-1 p-1 rounded-md z-10 shadow-lg">
          {speeds.map((s) => (
            <button
              key={s.value}
              className={`block px-4 py-2 text-sm rounded hover:bg-gray-100 w-full text-left ${
                speed === s.value ? 'bg-gray-100' : ''
              }`}
              onClick={() => setSpeed(s.value)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.WALL ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.WALL)}
          title="Wall Tool"
        >
          <Square size={18} />
        </button>
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.WEIGHT ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.WEIGHT)}
          title="Weight Tool"
        >
          <Weight size={18} />
        </button>
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.FOOD ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.FOOD)}
          title="Food Tool"
        >
          <Circle size={18} />
        </button>
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.START ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.START)}
          title="Start Node Tool"
        >
          <Home size={18} />
        </button>
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.FINISH ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.FINISH)}
          title="Finish Node Tool"
        >
          <Target size={18} />
        </button>
        <button
          className={`p-2 rounded-md ${currentTool === ToolType.ERASER ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          onClick={() => setTool(ToolType.ERASER)}
          title="Eraser Tool"
        >
          <X size={18} />
        </button>
      </div>

      {/* Grid Operations */}
      <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={clearPath}
          title="Clear Path"
        >
          <ArrowRight size={18} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={clearWallsAndWeights}
          title="Clear Walls & Weights"
        >
          <Edit size={18} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={clearBoard}
          title="Clear Board"
        >
          <RefreshCw size={18} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-gray-100"
          onClick={resetView}
          title="Reset View"
        >
          <Grid size={18} />
        </button>
      </div>

      {/* CSS for dropdown menus */}
      <style>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default Toolbar; 
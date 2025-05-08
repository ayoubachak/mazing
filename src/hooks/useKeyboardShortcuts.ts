import { useEffect } from 'react';
import { useInteraction, ToolType } from '../state/InteractionContext';
import { useGrid } from '../state/GridContext';
import { useAlgorithm } from '../state/AlgorithmContext';
import { useVisualization } from '../state/VisualizationContext';
import { VisualizationState } from '../core/VisualizationEngine';

export const useKeyboardShortcuts = () => {
  const { setTool, resetView } = useInteraction();
  const { clearPath, clearWallsAndWeights, clearBoard } = useGrid();
  const { runAlgorithm, stopAlgorithm } = useAlgorithm();
  const { visualizationState, clearVisualization } = useVisualization();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        // Tool shortcuts
        case 'w':
          setTool(ToolType.WALL);
          break;
        case 'e':
          setTool(ToolType.WEIGHT);
          break;
        case 'f':
          setTool(ToolType.FOOD);
          break;
        case 's':
          setTool(ToolType.START);
          break;
        case 't':
          setTool(ToolType.FINISH);
          break;
        case 'x':
          setTool(ToolType.ERASER);
          break;

        // Action shortcuts
        case ' ': // Space bar
          e.preventDefault(); // Prevent page scroll
          if (visualizationState === VisualizationState.RUNNING) {
            stopAlgorithm();
            clearVisualization();
          } else {
            clearPath();
            runAlgorithm();
          }
          break;
        case 'escape':
          stopAlgorithm();
          clearVisualization();
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            // Skip when Ctrl+C is used for copy
            return;
          }
          if (e.altKey) {
            clearBoard();
          } else {
            clearPath();
          }
          break;
        case 'r':
          if (e.altKey) {
            resetView();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            // Skip when Ctrl+Z is used for undo
            return;
          }
          clearWallsAndWeights();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    setTool, 
    resetView, 
    clearPath, 
    clearWallsAndWeights, 
    clearBoard, 
    runAlgorithm, 
    stopAlgorithm, 
    clearVisualization, 
    visualizationState
  ]);
}; 
import { useEffect } from 'react';
import { useInteractionContext, ToolType } from '../state/InteractionContext';
import { useGridContext } from '../state/GridContext';
import { useAlgorithmContext } from '../state/AlgorithmContext';
import { useVisualizationContext } from '../state/VisualizationContext';
import { VisualizationState } from '../core/VisualizationEngine';

export const useKeyboardShortcuts = () => {
  const { setTool, resetView } = useInteractionContext();
  const { clearPath, clearWallsAndWeights, clearBoard } = useGridContext();
  const { runSelectedAlgorithm } = useAlgorithmContext();
  const { visualizationState, resetVisualization } = useVisualizationContext();

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
            resetVisualization();
          } else {
            runSelectedAlgorithm();
          }
          break;
        case 'escape':
          resetVisualization();
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
    runSelectedAlgorithm, 
    resetVisualization, 
    visualizationState
  ]);
}; 
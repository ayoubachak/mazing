export interface GridNode {
  row: number;
  col: number;
  isStart: boolean;
  isFinish: boolean;
  isWall: boolean;
  isFood: boolean;
  isWeight: boolean;
  weightValue: number;
  isVisited: boolean;
  distance: number;
  previousNode: GridNode | null;
  isShortest: boolean;
  heuristic: number;
  fScore: number;
}

export interface ToolbarProps {
  isMenuOpen: boolean;
  algorithm: string;
  setAlgorithm: (algorithm: string) => void;
  currentTool: string;
  setCurrentTool: (tool: string) => void;
  clearBoard: () => void;
  clearWallsAndWeights: () => void;
  clearPath: () => void;
  speed: string;
  setSpeed: (speed: string) => void;
  generateMaze: (type: string) => void;
  onShowTooltip?: (content: string, event: React.MouseEvent) => void;
  onHideTooltip?: () => void;
}

export interface NodeProps {
  node: GridNode;
  onMouseDown: (row: number, col: number, event: React.MouseEvent) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
} 
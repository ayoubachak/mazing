import { eventBus, EVENTS } from './EventBus';

export interface NodePosition {
  row: number;
  col: number;
}

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

export class GridModel {
  private grid: GridNode[][] = [];
  private rows: number;
  private cols: number;
  private startNode: NodePosition;
  private finishNode: NodePosition;
  private foodNodes: NodePosition[] = [];

  constructor(rows: number, cols: number, startNode: NodePosition, finishNode: NodePosition) {
    this.rows = rows;
    this.cols = cols;
    this.startNode = startNode;
    this.finishNode = finishNode;
    this.initializeGrid();
  }

  /**
   * Initialize the grid with default nodes
   */
  initializeGrid(): void {
    const newGrid: GridNode[][] = [];
    
    for (let row = 0; row < this.rows; row++) {
      const currentRow: GridNode[] = [];
      for (let col = 0; col < this.cols; col++) {
        currentRow.push(this.createNode(row, col));
      }
      newGrid.push(currentRow);
    }
    
    this.grid = newGrid;
    eventBus.publish(EVENTS.GRID_INITIALIZED, { grid: this.grid });
  }

  /**
   * Create a node with default values
   */
  private createNode(row: number, col: number): GridNode {
    return {
      row,
      col,
      isStart: row === this.startNode.row && col === this.startNode.col,
      isFinish: row === this.finishNode.row && col === this.finishNode.col,
      isFood: this.foodNodes.some(food => food.row === row && food.col === col),
      isWall: false,
      isWeight: false,
      weightValue: 1,
      isVisited: false,
      distance: Infinity,
      previousNode: null,
      isShortest: false,
      heuristic: 0,
      fScore: Infinity,
    };
  }

  /**
   * Get the current grid
   */
  getGrid(): GridNode[][] {
    return this.grid;
  }

  /**
   * Get a specific node
   */
  getNode(row: number, col: number): GridNode | null {
    if (this.isValidPosition(row, col)) {
      return this.grid[row][col];
    }
    return null;
  }

  /**
   * Check if position is within grid bounds
   */
  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * Update a node's properties
   */
  updateNode(row: number, col: number, properties: Partial<GridNode>): void {
    if (!this.isValidPosition(row, col)) return;
    
    const node = this.grid[row][col];
    const updatedNode = { ...node, ...properties };
    
    // Handle special case: if making this a wall, remove food or weight
    if (properties.isWall && updatedNode.isWall) {
      updatedNode.isFood = false;
      updatedNode.isWeight = false;
      updatedNode.weightValue = 1;
      
      // Remove from food nodes if it was a food node
      if (node.isFood) {
        this.foodNodes = this.foodNodes.filter(
          food => !(food.row === row && food.col === col)
        );
      }
    }
    
    // Handle food node tracking
    if ('isFood' in properties) {
      if (properties.isFood && !node.isFood) {
        this.foodNodes.push({ row, col });
      } else if (!properties.isFood && node.isFood) {
        this.foodNodes = this.foodNodes.filter(
          food => !(food.row === row && food.col === col)
        );
      }
    }
    
    // If this is start or finish node, update tracking
    if (properties.isStart && !node.isStart) {
      // Clear previous start node
      const prevStart = this.startNode;
      if (this.isValidPosition(prevStart.row, prevStart.col)) {
        this.grid[prevStart.row][prevStart.col].isStart = false;
      }
      this.startNode = { row, col };
    }
    
    if (properties.isFinish && !node.isFinish) {
      // Clear previous finish node
      const prevFinish = this.finishNode;
      if (this.isValidPosition(prevFinish.row, prevFinish.col)) {
        this.grid[prevFinish.row][prevFinish.col].isFinish = false;
      }
      this.finishNode = { row, col };
    }
    
    // Update the grid
    this.grid[row][col] = updatedNode;
    
    // Publish event
    eventBus.publish(EVENTS.GRID_NODE_CHANGED, { 
      node: updatedNode,
      previousNode: node
    });
  }

  /**
   * Clear all walls and weights
   */
  clearWallsAndWeights(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = this.grid[row][col];
        if (node.isWall || node.isWeight) {
          this.updateNode(row, col, {
            isWall: false,
            isWeight: false,
            weightValue: 1
          });
        }
      }
    }
  }

  /**
   * Clear visualization states (visited, shortest path)
   */
  clearVisualization(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.updateNode(row, col, {
          isVisited: false,
          isShortest: false,
          distance: Infinity,
          previousNode: null,
          heuristic: 0,
          fScore: Infinity
        });
      }
    }
  }

  /**
   * Clear everything and reset the grid
   */
  clearAll(): void {
    this.foodNodes = [];
    this.initializeGrid();
  }

  /**
   * Get start node
   */
  getStartNode(): NodePosition {
    return this.startNode;
  }

  /**
   * Get finish node
   */
  getFinishNode(): NodePosition {
    return this.finishNode;
  }

  /**
   * Get food nodes
   */
  getFoodNodes(): NodePosition[] {
    return [...this.foodNodes];
  }

  /**
   * Set start node position
   */
  setStartNode(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    // Don't place on a wall
    if (this.grid[row][col].isWall) return;
    
    // Don't place on finish node
    if (row === this.finishNode.row && col === this.finishNode.col) return;
    
    // Clear old start node
    this.updateNode(this.startNode.row, this.startNode.col, { isStart: false });
    
    // Set new start node
    this.startNode = { row, col };
    this.updateNode(row, col, { 
      isStart: true,
      isWall: false,
      isWeight: false,
      isFood: false
    });
  }

  /**
   * Set finish node position
   */
  setFinishNode(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    // Don't place on a wall
    if (this.grid[row][col].isWall) return;
    
    // Don't place on start node
    if (row === this.startNode.row && col === this.startNode.col) return;
    
    // Clear old finish node
    this.updateNode(this.finishNode.row, this.finishNode.col, { isFinish: false });
    
    // Set new finish node
    this.finishNode = { row, col };
    this.updateNode(row, col, { 
      isFinish: true,
      isWall: false,
      isWeight: false,
      isFood: false
    });
  }

  /**
   * Toggle a wall at the specified position
   */
  toggleWall(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    const node = this.grid[row][col];
    
    // Don't toggle walls on start or finish nodes
    if (node.isStart || node.isFinish) return;
    
    this.updateNode(row, col, { isWall: !node.isWall });
  }

  /**
   * Toggle a food node at the specified position
   */
  toggleFood(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    const node = this.grid[row][col];
    
    // Don't toggle food on start, finish, or wall nodes
    if (node.isStart || node.isFinish || node.isWall) return;
    
    this.updateNode(row, col, { isFood: !node.isFood });
  }

  /**
   * Toggle a weight at the specified position
   */
  toggleWeight(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    const node = this.grid[row][col];
    
    // Don't toggle weights on start, finish, wall, or food nodes
    if (node.isStart || node.isFinish || node.isWall || node.isFood) return;
    
    const newIsWeight = !node.isWeight;
    this.updateNode(row, col, { 
      isWeight: newIsWeight,
      weightValue: newIsWeight ? 5 : 1
    });
  }

  /**
   * Set a node as visited during algorithm visualization
   */
  setNodeAsVisited(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    this.updateNode(row, col, { isVisited: true });
  }

  /**
   * Set a node as part of the shortest path
   */
  setNodeAsShortestPath(row: number, col: number): void {
    if (!this.isValidPosition(row, col)) return;
    
    this.updateNode(row, col, { isShortest: true });
  }

  /**
   * Resize the grid
   */
  resize(newRows: number, newCols: number): void {
    if (newRows <= 0 || newCols <= 0) return;
    
    this.rows = newRows;
    this.cols = newCols;
    
    // Ensure start and finish nodes are still within bounds
    if (this.startNode.row >= newRows) this.startNode.row = newRows - 1;
    if (this.startNode.col >= newCols) this.startNode.col = newCols - 1;
    if (this.finishNode.row >= newRows) this.finishNode.row = newRows - 1;
    if (this.finishNode.col >= newCols) this.finishNode.col = newCols - 1;
    
    // Filter food nodes to keep only those within new bounds
    this.foodNodes = this.foodNodes.filter(food => 
      food.row < newRows && food.col < newCols
    );
    
    this.initializeGrid();
  }

  /**
   * Create a test pattern with a guaranteed path
   * This is useful for debugging to ensure the algorithm works
   */
  createTestPattern(): void {
    console.log('GridModel: Creating test pattern with guaranteed path');
    
    // First clear everything
    this.clearAll();
    
    // Create a simple maze pattern with walls
    for (let col = 5; col < this.cols - 5; col++) {
      // Create a horizontal wall with a gap
      if (col !== 15) {
        this.updateNode(5, col, { isWall: true });
      }
      
      // Create a second horizontal wall below
      if (col !== 25) {
        this.updateNode(15, col, { isWall: true });
      }
    }
    
    // Create a vertical connecting wall
    for (let row = 6; row < 15; row++) {
      this.updateNode(row, 30, { isWall: true });
    }
    
    // Place some weights
    this.updateNode(8, 20, { isWeight: true, weightValue: 5 });
    this.updateNode(12, 12, { isWeight: true, weightValue: 10 });
    
    console.log('GridModel: Test pattern created');
  }
} 
import type { GridNode, NodePosition } from './GridModel';
import { eventBus, EVENTS } from './EventBus';

/**
 * Interface for algorithm results
 */
export type AlgorithmResult = {
  visitedNodesInOrder: GridNode[];
  nodesInShortestPathOrder: GridNode[];
};

/**
 * AlgorithmEngine - Handles all pathfinding algorithm calculations
 * 
 * This class is responsible for running algorithms and returning results
 * without directly modifying the UI
 */
export class AlgorithmEngine {
  private grid: GridNode[][];
  
  constructor(grid: GridNode[][]) {
    this.grid = grid;
  }
  
  /**
   * Update the grid reference
   */
  updateGrid(grid: GridNode[][]): void {
    this.grid = grid;
  }
  
  /**
   * Get all nodes in the grid
   */
  private getAllNodes(): GridNode[] {
    const nodes: GridNode[] = [];
    for (const row of this.grid) {
      for (const node of row) {
        nodes.push(node);
      }
    }
    return nodes;
  }
  
  /**
   * Sort nodes by distance (for Dijkstra's algorithm)
   */
  private sortNodesByDistance(unvisitedNodes: GridNode[]): void {
    unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
  }
  
  /**
   * Sort nodes by fScore (for A* algorithm)
   */
  private sortNodesByFScore(unvisitedNodes: GridNode[]): void {
    unvisitedNodes.sort((nodeA, nodeB) => {
      if (nodeA.fScore === nodeB.fScore) {
        return nodeA.heuristic - nodeB.heuristic;
      }
      return nodeA.fScore - nodeB.fScore;
    });
  }
  
  /**
   * Get unvisited neighbors of a node
   */
  private getNeighbors(node: GridNode): GridNode[] {
    const neighbors: GridNode[] = [];
    const { row, col } = node;
    
    if (row > 0) neighbors.push(this.grid[row - 1][col]);
    if (row < this.grid.length - 1) neighbors.push(this.grid[row + 1][col]);
    if (col > 0) neighbors.push(this.grid[row][col - 1]);
    if (col < this.grid[0].length - 1) neighbors.push(this.grid[row][col + 1]);
    
    return neighbors;
  }
  
  /**
   * Update unvisited neighbors (for Dijkstra's algorithm)
   */
  private updateUnvisitedNeighbors(node: GridNode): void {
    const neighbors = this.getNeighbors(node);
    console.log(`AlgorithmEngine: Updating neighbors for node (${node.row},${node.col}), found ${neighbors.length} neighbors`);
    
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        const weight = neighbor.isWeight ? neighbor.weightValue : 1;
        const distanceToNeighbor = node.distance + weight;
        
        if (distanceToNeighbor < neighbor.distance) {
          neighbor.distance = distanceToNeighbor;
          neighbor.previousNode = node;
          console.log(`AlgorithmEngine: Updated neighbor (${neighbor.row},${neighbor.col}) with distance ${distanceToNeighbor}`);
        }
      }
    }
  }
  
  /**
   * Update unvisited neighbors (for A* algorithm)
   */
  private updateUnvisitedNeighborsAStar(node: GridNode, finishNode: GridNode): void {
    const neighbors = this.getNeighbors(node);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        const weight = neighbor.isWeight ? neighbor.weightValue : 1;
        const distanceToNeighbor = node.distance + weight;
        if (distanceToNeighbor < neighbor.distance) {
          neighbor.distance = distanceToNeighbor;
          neighbor.fScore = neighbor.distance + neighbor.heuristic;
          neighbor.previousNode = node;
        }
      }
    }
  }
  
  /**
   * Calculate Manhattan distance between two nodes
   */
  private calculateManhattanDistance(nodeA: GridNode, nodeB: GridNode): number {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
  }
  
  /**
   * Reconstruct the shortest path starting from finish node
   */
  private getNodesInShortestPathOrder(finishNode: GridNode): GridNode[] {
    const nodesInShortestPathOrder: GridNode[] = [];
    let currentNode: GridNode | null = finishNode;
    while (currentNode !== null) {
      nodesInShortestPathOrder.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
  }
  
  /**
   * Prepare a working copy of the grid for algorithm calculations
   */
  private prepareGrid(): GridNode[][] {
    console.log('AlgorithmEngine: Preparing grid - creating deep copy');
    
    // Create a deep copy of the grid
    const workingGrid = this.grid.map(row => 
      row.map(node => ({
        ...node,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
        heuristic: 0,
        fScore: Infinity
      }))
    );
    
    // Verify that important nodes exist and are properly marked
    const startPositions = [];
    const finishPositions = [];
    
    // Count start and finish nodes
    for (let row = 0; row < workingGrid.length; row++) {
      for (let col = 0; col < workingGrid[0].length; col++) {
        if (workingGrid[row][col].isStart) {
          startPositions.push({ row, col });
        }
        if (workingGrid[row][col].isFinish) {
          finishPositions.push({ row, col });
        }
      }
    }
    
    console.log('AlgorithmEngine: Grid validation', {
      dimensions: `${workingGrid.length}x${workingGrid[0].length}`,
      startNodes: startPositions,
      finishNodes: finishPositions
    });
    
    return workingGrid;
  }
  
  /**
   * Run Dijkstra's algorithm
   */
  runDijkstra(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    console.log('AlgorithmEngine: Running Dijkstra', {startNode, finishNode, foodNodes});
    
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    // Set start node distance to 0
    start.distance = 0;
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset distances for each iteration
      for (let row of workingGrid) {
        for (let node of row) {
          if (node !== currentStartNode) {
            node.distance = Infinity;
            node.previousNode = null;
          }
        }
      }
      
      const result = this.dijkstraHelper(workingGrid, currentStartNode, targetNode);
      
      if (result.nodesInOrder.length === 0) {
        // Path not found
        console.log('AlgorithmEngine: No path found to target', targetNode);
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    console.log('AlgorithmEngine: Dijkstra complete', {
      visitedNodes: allVisitedNodes.length,
      pathNodes: allNodesInPath.length
    });
    
    const result = {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
    
    // Publish algorithm completion event
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, result);
    
    // Return results for visualization
    return result;
  }
  
  /**
   * Helper method for Dijkstra's algorithm
   */
  private dijkstraHelper(
    grid: GridNode[][], 
    startNode: GridNode, 
    finishNode: GridNode
  ): { nodesInOrder: GridNode[], pathToTarget: GridNode[] } {
    const visitedNodesInOrder: GridNode[] = [];
    const unvisitedNodes = this.getAllNodes();
    
    console.log('AlgorithmEngine: Starting dijkstraHelper', {
      start: `(${startNode.row},${startNode.col})`,
      finish: `(${finishNode.row},${finishNode.col})`,
      totalNodes: unvisitedNodes.length
    });
    
    while (unvisitedNodes.length) {
      this.sortNodesByDistance(unvisitedNodes);
      const closestNode = unvisitedNodes.shift()!;
      
      // If we encounter a wall, skip it
      if (closestNode.isWall) {
        console.log(`AlgorithmEngine: Skipping wall at (${closestNode.row},${closestNode.col})`);
        continue;
      }
      
      // If the closest node is at a distance of infinity, we are trapped
      if (closestNode.distance === Infinity) {
        console.log('AlgorithmEngine: Trapped! No path found, closest node has infinite distance');
        console.log('Visited node count:', visitedNodesInOrder.length);
        return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
      }
      
      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);
      
      // If we've reached the target node, we're done
      if (closestNode === finishNode) {
        const nodesInShortestPathOrder = this.getNodesInShortestPathOrder(finishNode);
        console.log('AlgorithmEngine: Path found! Length:', nodesInShortestPathOrder.length);
        return { nodesInOrder: visitedNodesInOrder, pathToTarget: nodesInShortestPathOrder };
      }
      
      this.updateUnvisitedNeighbors(closestNode);
    }
    
    console.log('AlgorithmEngine: Exhausted all nodes without finding path');
    return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
  }
  
  /**
   * Run A* algorithm
   */
  runAStar(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    console.log('AlgorithmEngine: Running A*', {startNode, finishNode, foodNodes});
    
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    // Set start node distance to 0 and calculate heuristics
    start.distance = 0;
    
    // Calculate heuristics for all nodes
    for (const row of workingGrid) {
      for (const node of row) {
        node.heuristic = this.calculateManhattanDistance(node, finish);
        node.fScore = node.distance + node.heuristic;
      }
    }
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset distances for each iteration
      for (let row of workingGrid) {
        for (let node of row) {
          if (node !== currentStartNode) {
            node.distance = Infinity;
            node.previousNode = null;
            // Recalculate heuristic for current target
            node.heuristic = this.calculateManhattanDistance(node, targetNode);
            node.fScore = Infinity;
          }
        }
      }
      
      const result = this.aStarHelper(workingGrid, currentStartNode, targetNode);
      
      if (result.nodesInOrder.length === 0) {
        // Path not found
        console.log('AlgorithmEngine: No path found to target', targetNode);
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    console.log('AlgorithmEngine: A* complete', {
      visitedNodes: allVisitedNodes.length,
      pathNodes: allNodesInPath.length
    });
    
    const result = {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
    
    // Publish algorithm completion event
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, result);
    
    return result;
  }
  
  /**
   * Helper method for A* algorithm
   */
  private aStarHelper(
    grid: GridNode[][], 
    startNode: GridNode, 
    finishNode: GridNode
  ): { nodesInOrder: GridNode[], pathToTarget: GridNode[] } {
    const visitedNodesInOrder: GridNode[] = [];
    const unvisitedNodes = this.getAllNodes();
    
    while (unvisitedNodes.length) {
      this.sortNodesByFScore(unvisitedNodes);
      const closestNode = unvisitedNodes.shift()!;
      
      // If we encounter a wall, skip it
      if (closestNode.isWall) continue;
      
      // If the closest node is at a distance of infinity, we are trapped
      if (closestNode.distance === Infinity) {
        return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
      }
      
      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);
      
      // If we've reached the target node, we're done
      if (closestNode === finishNode) {
        const nodesInShortestPathOrder = this.getNodesInShortestPathOrder(finishNode);
        return { nodesInOrder: visitedNodesInOrder, pathToTarget: nodesInShortestPathOrder };
      }
      
      this.updateUnvisitedNeighborsAStar(closestNode, finishNode);
    }
    
    return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
  }
  
  /**
   * Run BFS algorithm
   */
  runBFS(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    console.log('AlgorithmEngine: Running BFS', {startNode, finishNode, foodNodes});
    
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    // Set start node as visited
    start.isVisited = true;
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset visited status for each iteration
      for (let row of workingGrid) {
        for (let node of row) {
          if (node !== currentStartNode) {
            node.isVisited = false;
            node.previousNode = null;
          }
        }
      }
      
      const result = this.bfsHelper(workingGrid, currentStartNode, targetNode);
      
      if (result.nodesInOrder.length === 0) {
        // Path not found
        console.log('AlgorithmEngine: No path found to target', targetNode);
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    console.log('AlgorithmEngine: BFS complete', {
      visitedNodes: allVisitedNodes.length,
      pathNodes: allNodesInPath.length
    });
    
    const result = {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
    
    // Publish algorithm completion event
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, result);
    
    return result;
  }
  
  /**
   * Helper method for Breadth-First Search
   */
  private bfsHelper(
    grid: GridNode[][], 
    startNode: GridNode, 
    finishNode: GridNode
  ): { nodesInOrder: GridNode[], pathToTarget: GridNode[] } {
    const visitedNodesInOrder: GridNode[] = [];
    const queue: GridNode[] = [startNode];
    startNode.isVisited = true;
    
    while (queue.length) {
      const currentNode = queue.shift()!;
      visitedNodesInOrder.push(currentNode);
      
      if (currentNode === finishNode) {
        return { 
          nodesInOrder: visitedNodesInOrder, 
          pathToTarget: this.getNodesInShortestPathOrder(finishNode) 
        };
      }
      
      const neighbors = this.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.isVisited = true;
          neighbor.previousNode = currentNode;
          queue.push(neighbor);
        }
      }
    }
    
    return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
  }
  
  /**
   * Run DFS algorithm
   */
  runDFS(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    console.log('AlgorithmEngine: Running DFS', {startNode, finishNode, foodNodes});
    
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    // Set start node as visited
    start.isVisited = true;
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset visited status for each iteration
      for (let row of workingGrid) {
        for (let node of row) {
          if (node !== currentStartNode) {
            node.isVisited = false;
            node.previousNode = null;
          }
        }
      }
      
      const result = this.dfsHelper(workingGrid, currentStartNode, targetNode);
      
      if (result.nodesInOrder.length === 0) {
        // Path not found
        console.log('AlgorithmEngine: No path found to target', targetNode);
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    console.log('AlgorithmEngine: DFS complete', {
      visitedNodes: allVisitedNodes.length,
      pathNodes: allNodesInPath.length
    });
    
    const result = {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
    
    // Publish algorithm completion event
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, result);
    
    return result;
  }
  
  /**
   * Helper method for Depth-First Search
   */
  private dfsHelper(
    grid: GridNode[][], 
    startNode: GridNode, 
    finishNode: GridNode
  ): { nodesInOrder: GridNode[], pathToTarget: GridNode[] } {
    const visitedNodesInOrder: GridNode[] = [];
    const stack: GridNode[] = [startNode];
    startNode.isVisited = true;
    
    while (stack.length) {
      const currentNode = stack.pop()!;
      visitedNodesInOrder.push(currentNode);
      
      if (currentNode === finishNode) {
        return { 
          nodesInOrder: visitedNodesInOrder, 
          pathToTarget: this.getNodesInShortestPathOrder(finishNode) 
        };
      }
      
      const neighbors = this.getNeighbors(currentNode).reverse();
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          neighbor.isVisited = true;
          neighbor.previousNode = currentNode;
          stack.push(neighbor);
        }
      }
    }
    
    return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
  }
  
  /**
   * Fixed debug version of Dijkstra's algorithm 
   * This bypasses the normal implementation to test the basic algorithm
   */
  runDebugDijkstra(
    startNode: NodePosition, 
    finishNode: NodePosition
  ): AlgorithmResult {
    console.log('AlgorithmEngine: Running Debug Dijkstra', { startNode, finishNode });
    
    // Create a working copy of the grid with all nodes
    const grid = [...this.grid]; // Use the original grid
    
    // Reset all nodes in the grid to prepare for algorithm
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        grid[row][col].isVisited = false;
        grid[row][col].distance = Infinity;
        grid[row][col].previousNode = null;
      }
    }
    
    // Get start and end node references
    const start = grid[startNode.row][startNode.col];
    const finish = grid[finishNode.row][finishNode.col];
    
    // Set initial distance for start node
    start.distance = 0;
    console.log('Start node has distance:', start.distance);
    
    // Initialize algorithm data structures
    const visitedNodesInOrder: GridNode[] = [];
    const unvisitedNodes: GridNode[] = [];
    
    // Add all nodes to unvisited set
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        unvisitedNodes.push(grid[row][col]);
      }
    }
    
    console.log(`Debug: Starting search with ${unvisitedNodes.length} unvisited nodes`);
    
    // Main algorithm loop - while we have unvisited nodes
    while (unvisitedNodes.length > 0) {
      // Sort nodes by distance
      unvisitedNodes.sort((a, b) => a.distance - b.distance);
      
      // Get the closest node
      const closestNode = unvisitedNodes.shift()!;
      console.log(`Debug: Closest node is (${closestNode.row},${closestNode.col}) with distance ${closestNode.distance}`);
      
      // Check if we're trapped (no path exists)
      if (closestNode.distance === Infinity) {
        console.log('Debug: Stuck with infinite distance, no path exists');
        break;
      }
      
      // Skip walls
      if (closestNode.isWall) {
        console.log(`Debug: Skipping wall at (${closestNode.row},${closestNode.col})`);
        continue;
      }
      
      // Mark as visited
      closestNode.isVisited = true;
      visitedNodesInOrder.push(closestNode);
      console.log(`Debug: Marked (${closestNode.row},${closestNode.col}) as visited, total visited: ${visitedNodesInOrder.length}`);
      
      // If we've reached the target, we can exit
      if (closestNode === finish) {
        console.log('Debug: Found the target node!');
        break;
      }
      
      // Update neighbors - calculate new distances
      const row = closestNode.row;
      const col = closestNode.col;
      
      // Check all four neighbors
      const neighbors = [];
      if (row > 0) neighbors.push(grid[row-1][col]); // Up
      if (row < grid.length-1) neighbors.push(grid[row+1][col]); // Down
      if (col > 0) neighbors.push(grid[row][col-1]); // Left
      if (col < grid[0].length-1) neighbors.push(grid[row][col+1]); // Right
      
      console.log(`Debug: Checking ${neighbors.length} neighbors of (${row},${col})`);
      
      for (const neighbor of neighbors) {
        // Skip if visited or wall
        if (neighbor.isVisited || neighbor.isWall) continue;
        
        // Calculate new distance
        const weight = neighbor.isWeight ? neighbor.weightValue : 1;
        const newDistance = closestNode.distance + weight;
        
        // Update if new distance is shorter
        if (newDistance < neighbor.distance) {
          neighbor.distance = newDistance;
          neighbor.previousNode = closestNode;
          console.log(`Debug: Updated neighbor (${neighbor.row},${neighbor.col}) with distance ${newDistance}`);
        }
      }
    }
    
    // Reconstruct the path if we found the target
    const nodesInShortestPathOrder: GridNode[] = [];
    if (finish.previousNode !== null) {
      let currentNode: GridNode | null = finish;
      while (currentNode !== null) {
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
      }
      console.log(`Debug: Found path with ${nodesInShortestPathOrder.length} nodes`);
    } else {
      console.log('Debug: No path found to target');
    }
    
    return {
      visitedNodesInOrder,
      nodesInShortestPathOrder
    };
  }
} 
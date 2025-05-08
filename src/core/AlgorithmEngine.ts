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
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        const weight = neighbor.isWeight ? neighbor.weightValue : 1;
        const distanceToNeighbor = node.distance + weight;
        if (distanceToNeighbor < neighbor.distance) {
          neighbor.distance = distanceToNeighbor;
          neighbor.previousNode = node;
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
    // Create a deep copy of the grid
    return this.grid.map(row => 
      row.map(node => ({
        ...node,
        isVisited: false,
        distance: Infinity,
        previousNode: null,
        heuristic: 0,
        fScore: Infinity
      }))
    );
  }
  
  /**
   * Run Dijkstra's algorithm
   */
  runDijkstra(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
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
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    });
    
    return {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
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
    
    while (unvisitedNodes.length) {
      this.sortNodesByDistance(unvisitedNodes);
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
      
      this.updateUnvisitedNeighbors(closestNode);
    }
    
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
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    // Set start node distance to 0 and calculate heuristic
    start.distance = 0;
    start.heuristic = this.calculateManhattanDistance(start, finish);
    start.fScore = start.distance + start.heuristic;
    
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
            node.heuristic = this.calculateManhattanDistance(node, targetNode);
            node.fScore = Infinity;
            node.previousNode = null;
          }
        }
      }
      
      const result = this.aStarHelper(workingGrid, currentStartNode, targetNode);
      
      if (result.nodesInOrder.length === 0) {
        // Path not found
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    });
    
    return {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
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
   * Run Breadth-First Search algorithm
   */
  runBFS(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset for each iteration
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
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    });
    
    return {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
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
   * Run Depth-First Search algorithm
   */
  runDFS(
    startNode: NodePosition, 
    finishNode: NodePosition, 
    foodNodes: NodePosition[] = []
  ): AlgorithmResult {
    // Create a working copy of the grid
    const workingGrid = this.prepareGrid();
    
    // Get start and finish nodes from the grid
    const start = workingGrid[startNode.row][startNode.col];
    const finish = workingGrid[finishNode.row][finishNode.col];
    
    let targetNodes = foodNodes.length > 0 
      ? [...foodNodes.map(food => workingGrid[food.row][food.col]), finish]
      : [finish];
    
    let currentStartNode = start;
    let allNodesInPath: GridNode[] = [];
    let allVisitedNodes: GridNode[] = [];
    
    // Process each target node
    for (let targetNode of targetNodes) {
      // Reset for each iteration
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
        break;
      }
      
      allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
      allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
      currentStartNode = targetNode;
    }
    
    eventBus.publish(EVENTS.ALGORITHM_COMPLETED, {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    });
    
    return {
      visitedNodesInOrder: allVisitedNodes,
      nodesInShortestPathOrder: allNodesInPath
    };
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
} 
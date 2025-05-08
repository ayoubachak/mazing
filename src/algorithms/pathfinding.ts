import type { GridNode } from '../components/types';

// Helper functions for algorithms
const getAllNodes = (grid: GridNode[][]) => {
  const nodes: GridNode[] = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
};

const sortNodesByDistance = (unvisitedNodes: GridNode[]) => {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
};

const sortNodesByFScore = (unvisitedNodes: GridNode[]) => {
  unvisitedNodes.sort((nodeA, nodeB) => {
    if (nodeA.fScore === nodeB.fScore) {
      return nodeA.heuristic - nodeB.heuristic;
    }
    return nodeA.fScore - nodeB.fScore;
  });
};

const updateUnvisitedNeighbors = (node: GridNode, grid: GridNode[][]) => {
  const neighbors = getNeighbors(node, grid);
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
};

const updateUnvisitedNeighborsAStar = (node: GridNode, grid: GridNode[][], finishNode: GridNode) => {
  const neighbors = getNeighbors(node, grid);
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
};

const getNeighbors = (node: GridNode, grid: GridNode[][]) => {
  const neighbors: GridNode[] = [];
  const { row, col } = node;
  
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  
  return neighbors;
};

const getNodesInShortestPathOrder = (finishNode: GridNode): GridNode[] => {
  const nodesInShortestPathOrder: GridNode[] = [];
  let currentNode: GridNode | null = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};

const calculateManhattanDistance = (nodeA: GridNode, nodeB: GridNode) => {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
};

// Dijkstra's Algorithm
export const runDijkstra = (
  grid: GridNode[][], 
  startNode: GridNode, 
  finishNode: GridNode, 
  foodNodes: {row: number, col: number}[]
) => {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => grid[food.row][food.col]), finishNode]
    : [finishNode];
  
  let currentStartNode = startNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    // Reset distances for each iteration
    for (let row of grid) {
      for (let node of row) {
        if (node !== currentStartNode) {
          node.distance = Infinity;
          node.previousNode = null;
        }
      }
    }
    
    const result = dijkstraHelper(grid, currentStartNode, targetNode, [...unvisitedNodes]);
    
    if (result.nodesInOrder.length === 0) {
      // Path not found
      break;
    }
    
    allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
    allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const dijkstraHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode, unvisitedNodes: GridNode[]) => {
  const visitedNodesInOrder: GridNode[] = [];
  
  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
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
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      return { nodesInOrder: visitedNodesInOrder, pathToTarget: nodesInShortestPathOrder };
    }
    
    updateUnvisitedNeighbors(closestNode, grid);
  }
  
  return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
};

// A* Algorithm
export const runAStar = (
  grid: GridNode[][], 
  startNode: GridNode, 
  finishNode: GridNode, 
  foodNodes: {row: number, col: number}[]
) => {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  startNode.heuristic = calculateManhattanDistance(startNode, finishNode);
  startNode.fScore = startNode.distance + startNode.heuristic;
  const unvisitedNodes = getAllNodes(grid);
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => grid[food.row][food.col]), finishNode]
    : [finishNode];
  
  let currentStartNode = startNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    // Reset distances for each iteration
    for (let row of grid) {
      for (let node of row) {
        if (node !== currentStartNode) {
          node.distance = Infinity;
          node.heuristic = calculateManhattanDistance(node, targetNode);
          node.fScore = Infinity;
          node.previousNode = null;
        }
      }
    }
    
    const result = aStarHelper(grid, currentStartNode, targetNode, [...unvisitedNodes]);
    
    if (result.nodesInOrder.length === 0) {
      // Path not found
      break;
    }
    
    allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
    allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const aStarHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode, unvisitedNodes: GridNode[]) => {
  const visitedNodesInOrder: GridNode[] = [];
  
  while (unvisitedNodes.length) {
    sortNodesByFScore(unvisitedNodes);
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
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      return { nodesInOrder: visitedNodesInOrder, pathToTarget: nodesInShortestPathOrder };
    }
    
    updateUnvisitedNeighborsAStar(closestNode, grid, finishNode);
  }
  
  return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
};

// Breadth-First Search
export const runBFS = (
  grid: GridNode[][], 
  startNode: GridNode, 
  finishNode: GridNode, 
  foodNodes: {row: number, col: number}[]
) => {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  startNode.isVisited = true;
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => grid[food.row][food.col]), finishNode]
    : [finishNode];
  
  let currentStartNode = startNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    // Reset for each iteration
    for (let row of grid) {
      for (let node of row) {
        if (node !== currentStartNode) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
        }
      }
    }
    
    const result = bfsHelper(grid, currentStartNode, targetNode);
    
    if (result.nodesInOrder.length === 0) {
      // Path not found
      break;
    }
    
    allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
    allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const bfsHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode) => {
  const visitedNodesInOrder: GridNode[] = [];
  const queue: GridNode[] = [startNode];
  startNode.isVisited = true;
  
  while (queue.length) {
    const currentNode = queue.shift()!;
    visitedNodesInOrder.push(currentNode);
    
    if (currentNode === finishNode) {
      return { 
        nodesInOrder: visitedNodesInOrder, 
        pathToTarget: getNodesInShortestPathOrder(finishNode) 
      };
    }
    
    const neighbors = getNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        queue.push(neighbor);
      }
    }
  }
  
  return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
};

// Depth-First Search
export const runDFS = (
  grid: GridNode[][], 
  startNode: GridNode, 
  finishNode: GridNode, 
  foodNodes: {row: number, col: number}[]
) => {
  const visitedNodesInOrder: GridNode[] = [];
  startNode.distance = 0;
  startNode.isVisited = true;
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => grid[food.row][food.col]), finishNode]
    : [finishNode];
  
  let currentStartNode = startNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    // Reset for each iteration
    for (let row of grid) {
      for (let node of row) {
        if (node !== currentStartNode) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
        }
      }
    }
    
    const result = dfsHelper(grid, currentStartNode, targetNode);
    
    if (result.nodesInOrder.length === 0) {
      // Path not found
      break;
    }
    
    allVisitedNodes = [...allVisitedNodes, ...result.nodesInOrder];
    allNodesInPath = [...allNodesInPath, ...result.pathToTarget];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const dfsHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode) => {
  const visitedNodesInOrder: GridNode[] = [];
  const stack: GridNode[] = [startNode];
  startNode.isVisited = true;
  
  while (stack.length) {
    const currentNode = stack.pop()!;
    visitedNodesInOrder.push(currentNode);
    
    if (currentNode === finishNode) {
      return { 
        nodesInOrder: visitedNodesInOrder, 
        pathToTarget: getNodesInShortestPathOrder(finishNode) 
      };
    }
    
    const neighbors = getNeighbors(currentNode, grid).reverse();
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        neighbor.isVisited = true;
        neighbor.previousNode = currentNode;
        stack.push(neighbor);
      }
    }
  }
  
  return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
}; 
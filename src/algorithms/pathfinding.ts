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

// Add a helper function to check if two nodes are at the same position
const isSamePosition = (nodeA: GridNode, nodeB: GridNode) => {
  return nodeA.row === nodeB.row && nodeA.col === nodeB.col;
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
  
  // There's a potential issue where a path is found but the previousNode links weren't set up properly
  // We'll add extra debugging and error handling
  if (!currentNode) {
    console.error("Finish node is null in getNodesInShortestPathOrder");
    return [];
  }
  
  console.log(`Constructing shortest path starting from [${finishNode.row},${finishNode.col}]`);
  let safetyLimit = 1000; // Prevent infinite loops
  
  while (currentNode !== null && safetyLimit > 0) {
    nodesInShortestPathOrder.unshift(currentNode);
    
    // Debug info
    if (currentNode.previousNode) {
      console.log(`Node [${currentNode.row},${currentNode.col}] connects to previous node [${currentNode.previousNode.row},${currentNode.previousNode.col}]`);
    } else if (currentNode !== finishNode) {
      console.warn(`Node [${currentNode.row},${currentNode.col}] has no previous node reference but is not the start node`);
    }
    
    currentNode = currentNode.previousNode;
    safetyLimit--;
  }
  
  if (safetyLimit <= 0) {
    console.error("Potential infinite loop detected in shortest path construction");
  }
  
  console.log(`Found path with ${nodesInShortestPathOrder.length} nodes`);
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
  console.log('Dijkstra algorithm starting with:', {
    startNode: `[${startNode.row},${startNode.col}]`,
    finishNode: `[${finishNode.row},${finishNode.col}]`,
    foodNodes: foodNodes.length
  });
  
  // Deep clone the grid to avoid side effects
  const workingGrid = grid.map(row => row.map(node => ({...node})));
  const workingStartNode = workingGrid[startNode.row][startNode.col];
  const workingFinishNode = workingGrid[finishNode.row][finishNode.col];
  
  // Initialize all nodes in the grid properly
  for (let row of workingGrid) {
    for (let node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }
  
  // Set the distance of the start node to 0
  workingStartNode.distance = 0;
  
  const visitedNodesInOrder: GridNode[] = [];
  const unvisitedNodes = getAllNodes(workingGrid);
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => workingGrid[food.row][food.col]), workingFinishNode]
    : [workingFinishNode];
  
  console.log('Target nodes:', targetNodes.map(n => `[${n.row},${n.col}]`));
  
  let currentStartNode = workingStartNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    console.log(`Processing path from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
    
    // Reset distances for each iteration
    for (let row of workingGrid) {
      for (let node of row) {
        if (!isSamePosition(node, currentStartNode)) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
        }
      }
    }
    
    // Make sure the start node's distance is still 0
    currentStartNode.distance = 0;
    currentStartNode.isVisited = false;
    
    const result = dijkstraHelper(workingGrid, currentStartNode, targetNode, [...unvisitedNodes]);
    
    if (result.nodesInOrder.length === 0) {
      console.error(`No path found from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
      continue; // Continue to next target instead of breaking
    }
    
    console.log(`Found path with ${result.pathToTarget.length} nodes through ${result.nodesInOrder.length} visited nodes`);
    
    // Map the working grid nodes back to the original grid nodes 
    // to ensure we return nodes from the original grid
    const mappedVisitedNodes = result.nodesInOrder.map(
      node => grid[node.row][node.col]
    );
    
    const mappedPathNodes = result.pathToTarget.map(
      node => grid[node.row][node.col]
    );
    
    allVisitedNodes = [...allVisitedNodes, ...mappedVisitedNodes];
    allNodesInPath = [...allNodesInPath, ...mappedPathNodes];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const dijkstraHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode, unvisitedNodes: GridNode[]) => {
  const visitedNodesInOrder: GridNode[] = [];
  
  // Reset the unvisitedNodes list to make sure all nodes are included
  unvisitedNodes = getAllNodes(grid);
  
  // Make sure the start node has distance 0
  for (let node of unvisitedNodes) {
    if (node.row === startNode.row && node.col === startNode.col) {
      node.distance = 0;
    }
  }
  
  while (unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift()!;
    
    // Log some debugging info
    if (unvisitedNodes.length % 100 === 0) {
      console.log(`Processing node [${closestNode.row},${closestNode.col}] with distance ${closestNode.distance}, ${unvisitedNodes.length} nodes remaining`);
    }
    
    // If we encounter a wall, skip it
    if (closestNode.isWall) continue;
    
    // If the closest node is at a distance of infinity, we are trapped
    if (closestNode.distance === Infinity) {
      console.warn('No possible path found - all remaining nodes have infinite distance');
      return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
    }
    
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    
    // If we've reached the target node, we're done
    if (isSamePosition(closestNode, finishNode)) {
      console.log(`Found path to target node [${finishNode.row},${finishNode.col}]`);
      const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
      return { nodesInOrder: visitedNodesInOrder, pathToTarget: nodesInShortestPathOrder };
    }
    
    updateUnvisitedNeighbors(closestNode, grid);
  }
  
  console.warn('Exhausted all nodes without finding target');
  return { nodesInOrder: visitedNodesInOrder, pathToTarget: [] };
};

// A* Algorithm
export const runAStar = (
  grid: GridNode[][], 
  startNode: GridNode, 
  finishNode: GridNode, 
  foodNodes: {row: number, col: number}[]
) => {
  console.log('A* algorithm starting with:', {
    startNode: `[${startNode.row},${startNode.col}]`,
    finishNode: `[${finishNode.row},${finishNode.col}]`,
    foodNodes: foodNodes.length
  });
  
  // Deep clone the grid to avoid side effects
  const workingGrid = grid.map(row => row.map(node => ({...node})));
  const workingStartNode = workingGrid[startNode.row][startNode.col];
  const workingFinishNode = workingGrid[finishNode.row][finishNode.col];
  
  // Initialize all nodes
  for (let row of workingGrid) {
    for (let node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
      node.heuristic = calculateManhattanDistance(node, workingFinishNode);
      node.fScore = Infinity;
    }
  }
  
  // Set start node values
  workingStartNode.distance = 0;
  workingStartNode.fScore = workingStartNode.heuristic;
  
  const visitedNodesInOrder: GridNode[] = [];
  const unvisitedNodes = getAllNodes(workingGrid);
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => workingGrid[food.row][food.col]), workingFinishNode]
    : [workingFinishNode];
  
  let currentStartNode = workingStartNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    console.log(`Processing path from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
    
    // Reset distances for each iteration
    for (let row of workingGrid) {
      for (let node of row) {
        if (!isSamePosition(node, currentStartNode)) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
          node.heuristic = calculateManhattanDistance(node, targetNode);
          node.fScore = Infinity;
        }
      }
    }
    
    // Make sure the start node's distance is still 0
    currentStartNode.distance = 0;
    currentStartNode.fScore = currentStartNode.heuristic;
    currentStartNode.isVisited = false;
    
    const result = aStarHelper(workingGrid, currentStartNode, targetNode, [...unvisitedNodes]);
    
    if (result.nodesInOrder.length === 0) {
      console.error(`No path found from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
      continue; // Continue to next target instead of breaking
    }
    
    // Map the working grid nodes back to the original grid nodes
    const mappedVisitedNodes = result.nodesInOrder.map(
      node => grid[node.row][node.col]
    );
    
    const mappedPathNodes = result.pathToTarget.map(
      node => grid[node.row][node.col]
    );
    
    allVisitedNodes = [...allVisitedNodes, ...mappedVisitedNodes];
    allNodesInPath = [...allNodesInPath, ...mappedPathNodes];
    currentStartNode = targetNode;
  }
  
  return {
    visitedNodesInOrder: allVisitedNodes,
    nodesInShortestPathOrder: allNodesInPath
  };
};

const aStarHelper = (grid: GridNode[][], startNode: GridNode, finishNode: GridNode, unvisitedNodes: GridNode[]) => {
  const visitedNodesInOrder: GridNode[] = [];
  
  // Reset the unvisitedNodes list
  unvisitedNodes = getAllNodes(grid);
  
  // Set start node distance to 0
  for (let node of unvisitedNodes) {
    if (node.row === startNode.row && node.col === startNode.col) {
      node.distance = 0;
      node.fScore = node.heuristic; // Initial fScore is just the heuristic
    }
  }
  
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
    if (isSamePosition(closestNode, finishNode)) {
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
  console.log('BFS algorithm starting with:', {
    startNode: `[${startNode.row},${startNode.col}]`,
    finishNode: `[${finishNode.row},${finishNode.col}]`,
    foodNodes: foodNodes.length
  });
  
  // Deep clone the grid to avoid side effects
  const workingGrid = grid.map(row => row.map(node => ({...node})));
  const workingStartNode = workingGrid[startNode.row][startNode.col];
  const workingFinishNode = workingGrid[finishNode.row][finishNode.col];
  
  // Initialize all nodes
  for (let row of workingGrid) {
    for (let node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }
  
  // Set start node values
  workingStartNode.distance = 0;
  workingStartNode.isVisited = true;
  
  const visitedNodesInOrder: GridNode[] = [];
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => workingGrid[food.row][food.col]), workingFinishNode]
    : [workingFinishNode];
  
  let currentStartNode = workingStartNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    console.log(`Processing path from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
    
    // Reset for each iteration
    for (let row of workingGrid) {
      for (let node of row) {
        if (!isSamePosition(node, currentStartNode)) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
        }
      }
    }
    
    // Make sure the start node is properly initialized
    currentStartNode.distance = 0;
    currentStartNode.isVisited = true;
    
    const result = bfsHelper(workingGrid, currentStartNode, targetNode);
    
    if (result.nodesInOrder.length === 0) {
      console.error(`No path found from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
      continue; // Continue to next target instead of breaking
    }
    
    // Map the working grid nodes back to the original grid nodes
    const mappedVisitedNodes = result.nodesInOrder.map(
      node => grid[node.row][node.col]
    );
    
    const mappedPathNodes = result.pathToTarget.map(
      node => grid[node.row][node.col]
    );
    
    allVisitedNodes = [...allVisitedNodes, ...mappedVisitedNodes];
    allNodesInPath = [...allNodesInPath, ...mappedPathNodes];
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
    
    if (isSamePosition(currentNode, finishNode)) {
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
  console.log('DFS algorithm starting with:', {
    startNode: `[${startNode.row},${startNode.col}]`,
    finishNode: `[${finishNode.row},${finishNode.col}]`,
    foodNodes: foodNodes.length
  });
  
  // Deep clone the grid to avoid side effects
  const workingGrid = grid.map(row => row.map(node => ({...node})));
  const workingStartNode = workingGrid[startNode.row][startNode.col];
  const workingFinishNode = workingGrid[finishNode.row][finishNode.col];
  
  // Initialize all nodes
  for (let row of workingGrid) {
    for (let node of row) {
      node.distance = Infinity;
      node.isVisited = false;
      node.previousNode = null;
    }
  }
  
  // Set start node values
  workingStartNode.distance = 0;
  workingStartNode.isVisited = true;
  
  const visitedNodesInOrder: GridNode[] = [];
  
  // If there are food nodes, handle them first
  let targetNodes = foodNodes.length > 0 
    ? [...foodNodes.map(food => workingGrid[food.row][food.col]), workingFinishNode]
    : [workingFinishNode];
  
  let currentStartNode = workingStartNode;
  let allNodesInPath: GridNode[] = [];
  let allVisitedNodes: GridNode[] = [];
  
  // Process each target node
  for (let targetNode of targetNodes) {
    console.log(`Processing path from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
    
    // Reset for each iteration
    for (let row of workingGrid) {
      for (let node of row) {
        if (!isSamePosition(node, currentStartNode)) {
          node.distance = Infinity;
          node.isVisited = false;
          node.previousNode = null;
        }
      }
    }
    
    // Make sure the start node is properly initialized
    currentStartNode.distance = 0;
    currentStartNode.isVisited = true;
    
    const result = dfsHelper(workingGrid, currentStartNode, targetNode);
    
    if (result.nodesInOrder.length === 0) {
      console.error(`No path found from [${currentStartNode.row},${currentStartNode.col}] to [${targetNode.row},${targetNode.col}]`);
      continue; // Continue to next target instead of breaking
    }
    
    // Map the working grid nodes back to the original grid nodes
    const mappedVisitedNodes = result.nodesInOrder.map(
      node => grid[node.row][node.col]
    );
    
    const mappedPathNodes = result.pathToTarget.map(
      node => grid[node.row][node.col]
    );
    
    allVisitedNodes = [...allVisitedNodes, ...mappedVisitedNodes];
    allNodesInPath = [...allNodesInPath, ...mappedPathNodes];
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
    
    if (isSamePosition(currentNode, finishNode)) {
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
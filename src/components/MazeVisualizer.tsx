import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Play, Pause, Menu, X, AlertTriangle } from 'lucide-react';
import type { GridNode } from './types';
import { 
  runDijkstra, 
  runAStar, 
  runBFS, 
  runDFS 
} from '../algorithms/pathfinding';
import { generateRandomMaze, generateRecursiveDivisionMaze, generateDFSMaze, generatePrimsMaze, generateKruskalMaze } from '../algorithms/mazeGeneration';
import NodeComponent from './NodeComponent';
import Toolbar from './Toolbar';
import Legend from './Legend';
import useGridOperations from '../hooks/useGridOperations';
import Tooltip from './Tooltip';

export default function MazeVisualizer() {
  // Add a reducer to force re-renders
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Grid Configuration
  const rows = 25;
  const cols = 40;
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [currentTool, setCurrentTool] = useState('wall');
  const [startNode, setStartNode] = useState({ row: 10, col: 10 });
  const [finishNode, setFinishNode] = useState({ row: 10, col: 30 });
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [speed, setSpeed] = useState('fast');
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingFinish, setIsDraggingFinish] = useState(false);
  const [foodNodes, setFoodNodes] = useState<{row: number, col: number}[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [animateUpdates, setAnimateUpdates] = useState(true); // new toggle for live update animation
  const gridRef = useRef<HTMLDivElement>(null);

  // Ref for debouncing live updates
  const liveUpdateTimer = useRef<number | null>(null);

  // Use custom hook for grid operations
  const {
    grid,
    setGrid,
    initializeGrid,
    updateNodeInGrid,
    clearBoard: clearBoardOperation,
    clearWallsAndWeights: clearWallsAndWeightsOperation,
    clearPath: clearPathOperation
  } = useGridOperations(rows, cols, startNode, finishNode, foodNodes);

  // Initialize the grid once on mount
  useEffect(() => {
    initializeGrid();
  }, []);  // run only once to avoid resetting after maze generation

  // Handle tooltips
  const handleHideTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const handleShowTooltip = (content: string, event: React.MouseEvent) => {
    // Don't show tooltips if already running an algorithm
    if (isRunning) return;
    
    setTooltipContent(content);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    setShowTooltip(true);
  };

  // Board management functions
  const clearBoard = () => {
    setFoodNodes([]);
    clearBoardOperation();
    // also clear any existing path classes
    document.querySelectorAll('.node-visited, .node-shortest-path').forEach(el => {
      el.classList.remove('node-visited', 'node-shortest-path');
      (el as HTMLElement).style.backgroundColor = '';
    });
  };

  const clearWallsAndWeights = () => {
    clearWallsAndWeightsOperation();
  };

  const clearPath = () => {
    clearPathOperation();
    // remove any animated path classes
    document.querySelectorAll('.node-visited, .node-shortest-path').forEach(el => {
      el.classList.remove('node-visited', 'node-shortest-path');
      (el as HTMLElement).style.backgroundColor = '';
    });
    // liveMode removed
  };

  // Add a function to inspect DOM elements during animation
  const checkDOMForAnimationClasses = (row: number, col: number) => {
    // Safety check for valid row/col
    if (row < 0 || col < 0 || row >= rows || col >= cols) {
      console.warn(`Invalid node coordinates [${row},${col}] - outside grid bounds`);
      return;
    }
    
    setTimeout(() => {
      try {
        const nodeElement = document.getElementById(`node-${row}-${col}`);
        if (nodeElement) {
          console.log('DOM Node element at', [row, col], ':', {
            element: nodeElement,
            className: nodeElement.className,
            hasVisitedClass: nodeElement.className.includes('node-visited'),
            hasShortestPathClass: nodeElement.className.includes('node-shortest-path'),
            computedStyle: window.getComputedStyle(nodeElement),
            backgroundColor: window.getComputedStyle(nodeElement).backgroundColor
          });
        } else {
          console.warn(`DOM element for node-${row}-${col} not found`);
        }
      } catch (error) {
        console.error('Error inspecting DOM element:', error);
      }
    }, 10);
  };

  // Add a function to directly manipulate DOM to test if element manipulation works
  const forceStyleUpdateOnNode = (row: number, col: number, isVisited: boolean, isShortest: boolean) => {
    // Safety check for valid row/col
    if (row < 0 || col < 0 || row >= rows || col >= cols) {
      console.warn(`Invalid node coordinates [${row},${col}] - outside grid bounds`);
      return;
    }
    
    setTimeout(() => {
      try {
        const nodeElement = document.getElementById(`node-${row}-${col}`);
        if (nodeElement) {
          console.log('Directly updating DOM element style at', [row, col]);
          
          // Force direct style application
          if (isVisited) {
            nodeElement.classList.add('node-visited');
            nodeElement.style.backgroundColor = 'rgba(0, 158, 255, 0.8)';
          }
          
          if (isShortest) {
            nodeElement.classList.add('node-shortest-path');
            nodeElement.style.backgroundColor = 'rgba(255, 207, 0, 1)';
          }
        } else {
          console.warn(`DOM element for node-${row}-${col} not found, cannot apply styles`);
        }
      } catch (error) {
        console.error('Error updating DOM element style:', error);
      }
    }, 20); // Slight delay to ensure React has updated the DOM
  };

  // eslint-disable-next-line sonarjs/no-nested-callback, max-nested-callbacks
  const animateShortestPath = (nodesInShortestPathOrder: GridNode[]) => {
    console.log('animateShortestPath called with', nodesInShortestPathOrder.length, 'nodes');
    let speedFactor: number;
    if (speed === 'fast') speedFactor = 20;
    else if (speed === 'medium') speedFactor = 40;
    else speedFactor = 80;
    
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        // removed isRunning check to always allow animation in animateUpdates
        const node = nodesInShortestPathOrder[i];
        const { row, col } = node;
        console.log(`VisualizationEngine: Adding shortest path class to node-${row}-${col}`);
        
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          const updatedNode = {
            ...newGrid[row][col],
            isShortest: true
          };
          newGrid[row][col] = updatedNode;
          return newGrid;
        });

        forceStyleUpdateOnNode(row, col, false, true);
        forceUpdate();
        checkDOMForAnimationClasses(row, col);

        if (i === nodesInShortestPathOrder.length - 1) {
          console.log('VisualizationEngine: Finished animating shortest path');
          // Complete animation state
          setIsRunning(false);
        }
      }, speedFactor * i);
    }
  };

  // eslint-disable-next-line sonarjs/no-nested-callback, max-nested-callbacks
  const animateAlgorithm = (visitedNodesInOrder: GridNode[], nodesInShortestPathOrder: GridNode[]) => {
    console.log('animateAlgorithm called with', visitedNodesInOrder.length, 'visited nodes and', 
                nodesInShortestPathOrder.length, 'path nodes');
    let speedFactor: number;
    if (speed === 'fast') speedFactor = 10;
    else if (speed === 'medium') speedFactor = 25;
    else speedFactor = 50;
    
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        console.log('Visited nodes animation complete, starting shortest path animation');
        setTimeout(() => {
          // always animate shortest path when animateUpdates is true
          animateShortestPath(nodesInShortestPathOrder);
        }, speedFactor * i);
        return;
      }
      
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const { row, col } = node;
        console.log(`Animating visited node at [${row},${col}], i=${i}`);
        
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          const updatedNode = { ...newGrid[row][col], isVisited: true };
          newGrid[row][col] = updatedNode;
          return newGrid;
        });

        forceStyleUpdateOnNode(row, col, true, false);
        forceUpdate();
        checkDOMForAnimationClasses(row, col);
      }, speedFactor * i);
    }
  };

  // Handle mouse events
  const handleMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    // Only respond to left clicks (button === 0)
    if (event.button !== 0) return;
    
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    const node = grid[row][col];
    
    if (node.isStart) {
      setIsDraggingStart(true);
      return;
    }
    
    if (node.isFinish) {
      setIsDraggingFinish(true);
      return;
    }
    
    setIsMousePressed(true);
    updateNodeStatus(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    if (!isRunning && isMousePressed) {
      updateNodeStatus(row, col);
    }
    
    if (isDraggingStart) {
      moveStartNode(row, col);
    }
    
    if (isDraggingFinish) {
      moveFinishNode(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
    setIsDraggingStart(false);
    setIsDraggingFinish(false);
    // After completing interactions, re-run path based on animateUpdates
    if (!isRunning) {
      clearPath();
      if (liveUpdateTimer.current) window.clearTimeout(liveUpdateTimer.current);
      liveUpdateTimer.current = window.setTimeout(() => {
        // compute shortest path nodes
        const startNodeObj = grid[startNode.row][startNode.col];
        const finishNodeObj = grid[finishNode.row][finishNode.col];
        let result;
        try {
          switch (algorithm) {
            case 'astar': result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes); break;
            case 'bfs': result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
            case 'dfs': result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
            default: result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
          }
        } catch { return; }
        if (animateUpdates) {
          // Enable running state so animations execute
          setIsRunning(true);
          // animate full search and path
          animateAlgorithm(result.visitedNodesInOrder, result.nodesInShortestPathOrder);
        } else {
          // instant draw of visited and path
          directDrawVisitedAndPath();
        }
      }, 200) as unknown as number;
    }
  };

  // eslint-disable-next-line sonarjs/cognitive-complexity, sonarjs/max-switch-case, sonarjs/no-identical-expressions
  const updateNodeStatus = (row: number, col: number) => {
    if (
      (row === startNode.row && col === startNode.col) ||
      (row === finishNode.row && col === finishNode.col)
    ) {
      return;
    }
    const node = grid[row][col];
    let updatedNode = { ...node };
    switch (currentTool) {
      case 'wall':
        updatedNode.isWall = !node.isWall;
        updatedNode.isFood = false;
        updatedNode.isWeight = false;
        updatedNode.weightValue = 1;
        if (node.isFood) {
          setFoodNodes(prev => prev.filter(f => f.row !== row || f.col !== col));
        }
        break;
      case 'food':
        if (!node.isWall && !node.isWeight) {
          if (node.isFood) {
            updatedNode.isFood = false;
            setFoodNodes(prev => prev.filter(f => f.row !== row || f.col !== col));
          } else {
            updatedNode.isFood = true;
            setFoodNodes(prev => [...prev, { row, col }]);
          }
        }
        break;
      case 'weight':
        if (!node.isWall && !node.isFood) {
          updatedNode.isWeight = !node.isWeight;
          updatedNode.weightValue = updatedNode.isWeight ? 5 : 1;
        }
        break;
      case 'eraser':
        updatedNode.isWall = false;
        updatedNode.isWeight = false;
        updatedNode.weightValue = 1;
        if (node.isFood) {
          updatedNode.isFood = false;
          setFoodNodes(prev => prev.filter(f => f.row !== row || f.col !== col));
        }
        break;
    }
    updateNodeInGrid(row, col, updatedNode);
  };

  // Move start and finish nodes
  const moveStartNode = (row: number, col: number) => {
    if (row === finishNode.row && col === finishNode.col) return;
    if (grid[row][col].isWall) return;
    
    // Don't create duplicates - remove the old start node first
    const newGrid = grid.map(gridRow => 
      gridRow.map(node => {
        if (node.isStart) {
          return {
            ...node,
            isStart: false
          };
        }
        return node;
      })
    );
    
    // Update the grid with the new start position
    newGrid[row][col] = {
      ...newGrid[row][col],
      isStart: true,
      isWall: false,
      isWeight: false,
      isFood: false
    };
    
    // If this was a food node, remove it from foodNodes
    if (grid[row][col].isFood) {
      setFoodNodes(prev => prev.filter(food => !(food.row === row && food.col === col)));
    }
    
    setStartNode({ row, col });
    initializeGrid(newGrid);
  };

  const moveFinishNode = (row: number, col: number) => {
    if (row === startNode.row && col === startNode.col) return;
    if (grid[row][col].isWall) return;
    
    // Don't create duplicates - remove the old finish node first
    const newGrid = grid.map(gridRow => 
      gridRow.map(node => {
        if (node.isFinish) {
          return {
            ...node,
            isFinish: false
          };
        }
        return node;
      })
    );
    
    // Update the grid with the new finish position
    newGrid[row][col] = {
      ...newGrid[row][col],
      isFinish: true,
      isWall: false,
      isWeight: false,
      isFood: false
    };
    
    // If this was a food node, remove it from foodNodes
    if (grid[row][col].isFood) {
      setFoodNodes(prev => prev.filter(food => !(food.row === row && food.col === col)));
    }
    
    setFinishNode({ row, col });
    initializeGrid(newGrid);
  };

  // Add a function to inspect the grid state for debugging
  const debugGridState = useCallback(() => {
    if (!grid || grid.length === 0) {
      console.log('Grid is empty or undefined');
      return;
    }
    
    let visitedCount = 0;
    let shortestCount = 0;
    
    grid.forEach(row => {
      row.forEach(node => {
        if (node.isVisited) visitedCount++;
        if (node.isShortest) shortestCount++;
      });
    });
    
    console.log('Grid state check:', {
      gridSize: `${rows}x${cols}`,
      totalNodes: rows * cols,
      visitedNodes: visitedCount,
      shortestPathNodes: shortestCount,
      startNode,
      finishNode
    });
    
    // Safely check a specific node for debugging with boundary checks
    if (startNode && 
        startNode.row >= 0 && startNode.row < grid.length && 
        startNode.col + 1 >= 0 && startNode.col + 1 < grid[0].length) {
      const testNode = grid[startNode.row][startNode.col + 1];
      console.log('Test node next to start:', testNode);
    } else {
      console.log('Cannot access test node - start node or adjacent node is outside grid bounds');
    }
  }, [grid, rows, cols, startNode, finishNode]);
  
  // Add useEffect to monitor changes to isRunning and grid for debugging
  useEffect(() => {
    console.log('isRunning changed to:', isRunning);
    if (!isRunning && grid && grid.length > 0) {
      // If animation just finished, check the grid state
      debugGridState();
    }
  }, [isRunning, debugGridState, grid]);

  // Visualization function
  const visualizeAlgorithm = () => {
    console.log('visualizeAlgorithm called, isRunning:', isRunning);
    debugGridState(); // Check initial grid state
    
    if (isRunning) {
      // If we're already running, stop the visualization
      console.log('Stopping visualization');
      setIsRunning(false);
      clearPath();
      return;
    }
    
    clearPath();
    setIsRunning(true);
    console.log('Starting visualization, algorithm:', algorithm);
    
    const startNodeObj = grid[startNode.row][startNode.col];
    const finishNodeObj = grid[finishNode.row][finishNode.col];
    console.log('Start node:', startNode, 'Finish node:', finishNode);
    console.log('Food nodes:', foodNodes);
    
    let visitedNodesInOrder: GridNode[] = [];
    let nodesInShortestPathOrder: GridNode[] = [];
    
    try {
      if (algorithm === 'dijkstra') {
        console.log('Running Dijkstra algorithm');
        const result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'astar') {
        console.log('Running A* algorithm');
        const result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'bfs') {
        console.log('Running BFS algorithm');
        const result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'dfs') {
        console.log('Running DFS algorithm');
        const result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      }
      
      console.log("Starting visualization with:", { 
        algorithm,
        visitedNodesCount: visitedNodesInOrder.length,
        pathCount: nodesInShortestPathOrder.length 
      });
      
      if (visitedNodesInOrder.length === 0) {
        console.error('No visited nodes returned from algorithm');
        setIsRunning(false);
        return;
      }
      
      console.log('Calling animateAlgorithm with', visitedNodesInOrder.length, 'nodes');
      animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    } catch (error) {
      console.error('Error visualizing algorithm:', error);
      setIsRunning(false);
    }
  };

  // Add a "direct visualization" button and function that completely bypasses React state
  // Ref to store active animation timeouts for live updates
  const liveTimeouts = useRef<number[]>([]);
  const directVisualizeAlgorithm = () => {
    // clear previous live animation timeouts
    liveTimeouts.current.forEach(id => clearTimeout(id));
    liveTimeouts.current = [];
    console.log('Directly visualizing algorithm (bypassing React state)');
    // mark as running to enable live updates
    setIsRunning(true);

    // Clear any existing visualization first
    document.querySelectorAll('.node-visited, .node-shortest-path').forEach(el => {
      el.classList.remove('node-visited', 'node-shortest-path');
      (el as HTMLElement).style.backgroundColor = '';
    });
    
    const startNodeObj = grid[startNode.row][startNode.col];
    const finishNodeObj = grid[finishNode.row][finishNode.col];
    
    let visitedNodesInOrder: GridNode[] = [];
    let nodesInShortestPathOrder: GridNode[] = [];
    
    try {
      if (algorithm === 'dijkstra') {
        const result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'astar') {
        const result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'bfs') {
        const result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      } else if (algorithm === 'dfs') {
        const result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes);
        visitedNodesInOrder = result.visitedNodesInOrder;
        nodesInShortestPathOrder = result.nodesInShortestPathOrder;
      }
      
      console.log("Direct visualization with:", { 
        algorithm,
        visitedNodesCount: visitedNodesInOrder.length,
        pathCount: nodesInShortestPathOrder.length 
      });
      
      // Direct DOM manipulation to visualize the algorithm
      // determine custom speed factors
      const visitedSpeed = speed === 'fast' ? 5 : speed === 'medium' ? 15 : 30;
      const pathSpeed = visitedSpeed * 2;
      
      // Animate visited nodes
      visitedNodesInOrder.forEach((node, index) => {
        const id = window.setTimeout(() => {
          const { row, col } = node;
          const element = document.getElementById(`node-${row}-${col}`);
          if (element) element.classList.add('node-visited');
        }, visitedSpeed * index);
        liveTimeouts.current.push(id);
      });
      
      // Animate shortest path after visited nodes
      const pathStartId = window.setTimeout(() => {
        nodesInShortestPathOrder.forEach((node, index) => {
          const id2 = window.setTimeout(() => {
            const { row, col } = node;
            const element = document.getElementById(`node-${row}-${col}`);
            if (element) element.classList.add('node-shortest-path');
          }, pathSpeed * index);
          liveTimeouts.current.push(id2);
        });
        // when path animation done, mark as not running
        const doneId = window.setTimeout(() => setIsRunning(false), pathSpeed * nodesInShortestPathOrder.length);
        liveTimeouts.current.push(doneId);
      }, visitedSpeed * visitedNodesInOrder.length);
      liveTimeouts.current.push(pathStartId);
      
    } catch (error) {
      console.error('Error in direct visualization:', error);
    }
  };

  /** Draw only the shortest path immediately (no visited animation) */
  const directDrawShortestPath = () => {
    // clear previous path classes
    document.querySelectorAll('.node-shortest-path').forEach(el => {
      el.classList.remove('node-shortest-path');
      (el as HTMLElement).style.backgroundColor = '';
    });
    // compute path
    const startNodeObj = grid[startNode.row][startNode.col];
    const finishNodeObj = grid[finishNode.row][finishNode.col];
    let result;
    try {
      switch (algorithm) {
        case 'dijkstra': result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes); break;
        case 'astar': result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes); break;
        case 'bfs': result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
        case 'dfs': result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
        default: result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
      }
    } catch { return; }
    // highlight shortest path immediately
    result.nodesInShortestPathOrder.forEach(node => {
      const el = document.getElementById(`node-${node.row}-${node.col}`);
      if (el) el.classList.add('node-shortest-path');
    });
  };

  /**
   * Draw visited nodes and shortest path immediately (no animations)
   */
  const directDrawVisitedAndPath = () => {
    // clear previous classes
    document.querySelectorAll('.node-visited, .node-shortest-path').forEach(el => {
      el.classList.remove('node-visited', 'node-shortest-path');
      (el as HTMLElement).style.backgroundColor = '';
    });
    // compute result
    const startNodeObj = grid[startNode.row][startNode.col];
    const finishNodeObj = grid[finishNode.row][finishNode.col];
    let result;
    try {
      switch (algorithm) {
        case 'astar': result = runAStar(grid, startNodeObj, finishNodeObj, foodNodes); break;
        case 'bfs': result = runBFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
        case 'dfs': result = runDFS(grid, startNodeObj, finishNodeObj, foodNodes); break;
        default: result = runDijkstra(grid, startNodeObj, finishNodeObj, foodNodes);
      }
    } catch {
      return;
    }
    // color visited
    result.visitedNodesInOrder.forEach(node => {
      const el = document.getElementById(`node-${node.row}-${node.col}`);
      if (el) el.classList.add('node-visited');
    });
    // color shortest path
    result.nodesInShortestPathOrder.forEach(node => {
      const el = document.getElementById(`node-${node.row}-${node.col}`);
      if (el) el.classList.add('node-shortest-path');
    });
  };

  // Handle grid viewport navigation
  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse button or Alt+Left click
      setIsGrabbing(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      // Don't call preventDefault() here, as it's not needed for just setting state
    }
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (isGrabbing) {
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;
      
      setViewportPosition({
        x: viewportPosition.x + dx,
        y: viewportPosition.y + dy
      });
      
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleGridMouseUp = () => {
    if (isGrabbing) {
      setIsGrabbing(false);
    }
  };

  const handleZoom = (e: React.WheelEvent) => {
    // Don't call preventDefault on wheel events as they're passive by default
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
    setZoomLevel(prevZoom => {
      const newZoom = prevZoom * zoomFactor;
      // Limit zoom level between 0.5 and 3
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  // Maze generation functions
  const handleGenerateMaze = (type: string) => {
    if (isRunning) return;
    // Reset food nodes before generating maze
    setFoodNodes([]);
    // Generate and apply maze
    if (type === 'random') {
      initializeGrid(generateRandomMaze([...grid], startNode, finishNode));
    } else if (type === 'recursiveDivision') {
      initializeGrid(generateRecursiveDivisionMaze([...grid], startNode, finishNode, rows, cols));
    } else if (type === 'dfs') {
      initializeGrid(generateDFSMaze([...grid], startNode, finishNode));
    } else if (type === 'prims') {
      initializeGrid(generatePrimsMaze([...grid], startNode, finishNode));
    } else if (type === 'kruskal') {
      initializeGrid(generateKruskalMaze([...grid], startNode, finishNode));
    }
  };

  // Render the grid
  const renderGrid = () => {
    return (
      <div 
        className="grid-container flex-1 overflow-auto bg-gray-100"
        style={{
          cursor: isGrabbing ? 'grabbing' : 'default',
          position: 'relative',
          width: '100%',
          overflow: 'auto'
        }}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleGridMouseMove}
        onMouseUp={handleGridMouseUp}
        onMouseLeave={handleGridMouseUp}
        onWheel={handleZoom}
        ref={gridRef}
      >
        <div 
          className="grid-content"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${rows}, 1.5rem)`,
            gridTemplateColumns: `repeat(${cols}, 1.5rem)`,
            gap: '1px',
            transform: `translate(${viewportPosition.x}px, ${viewportPosition.y}px) scale(${zoomLevel})`,
            transition: isGrabbing ? 'none' : 'transform 0.05s ease',
            transformOrigin: 'center',
            padding: '20px',
            minWidth: '100%',
            minHeight: '100%'
          }}
        >
          {grid.map(row => (
            row.map(node => (
              <NodeComponent
                key={`${node.row}-${node.col}`}
                node={node}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
              />
            ))
          ))}
        </div>
        {showTooltip && (
          <Tooltip 
            content={tooltipContent} 
            position={tooltipPosition} 
            onClose={handleHideTooltip}
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Maze Visualizer</h1>
          <button 
            className="ml-4 p-2 rounded hover:bg-gray-700 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Hide menu" : "Show menu"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <div className="flex space-x-4">
          {/* single working visualize button using direct DOM approach */}
          <button
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-md flex items-center font-medium transition-colors shadow-sm"
            onClick={directVisualizeAlgorithm}
          >
            <Play size={16} className="mr-2" /> Visualize
          </button>
          {/* Animate Updates toggle */}
          <label className="flex items-center ml-4 text-sm text-white">
            <input
              type="checkbox"
              className="form-checkbox mr-2"
              checked={animateUpdates}
              onChange={e => setAnimateUpdates(e.target.checked)}
            />
            Animate Updates
          </label>
        </div>
        {/* Live Update removed; always instant redraw on mouseUp */}
      </div>
      
      {/* Toolbar */}
      <Toolbar 
        isMenuOpen={isMenuOpen}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        clearBoard={clearBoard}
        clearWallsAndWeights={clearWallsAndWeights}
        clearPath={clearPath}
        speed={speed}
        setSpeed={setSpeed}
        generateMaze={handleGenerateMaze}
        onShowTooltip={handleShowTooltip}
        onHideTooltip={handleHideTooltip}
      />
      
      {/* Legend */}
      <Legend />
      
      {/* Instructions with close button */}
      {showInstructions && (
        <div className="bg-blue-50 p-3 text-sm flex items-start gap-2 border-b relative">
          <AlertTriangle size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">How to use:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Drag start/target nodes</strong> to reposition</li>
              <li><strong>Click and drag</strong> to add/remove walls, weights, or food</li>
              <li><strong>Alt+Click or middle mouse button</strong> to pan the grid</li>
              <li><strong>Mouse wheel</strong> to zoom in/out</li>
              <li><strong>Food nodes</strong> act as waypoints - the algorithm will visit them before the target</li>
              <li><strong>Weight nodes</strong> slow down the algorithm (higher cost to traverse)</li>
            </ul>
          </div>
          <button 
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
            onClick={() => setShowInstructions(false)}
            aria-label="Close instructions"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Grid */}
      <div className="flex-1 flex flex-col">
        {renderGrid()}
      </div>
    </div>
  );
}
import type { GridNode } from '../components/types';

/**
 * Generate a random maze with approximately 25% walls
 */
export const generateRandomMaze = (grid: GridNode[][], startNode: {row: number, col: number}, finishNode: {row: number, col: number}) => {
  const newGrid = [...grid];
  
  // Clear any existing walls first
  for (let row = 0; row < newGrid.length; row++) {
    for (let col = 0; col < newGrid[0].length; col++) {
      newGrid[row][col].isWall = false;
    }
  }
  
  // Make a buffer zone around start and finish nodes
  const bufferZone = 2;
  
  for (let row = 0; row < newGrid.length; row++) {
    for (let col = 0; col < newGrid[0].length; col++) {
      // Skip start and finish nodes and their buffer zones
      if (
        (Math.abs(row - startNode.row) <= bufferZone && Math.abs(col - startNode.col) <= bufferZone) ||
        (Math.abs(row - finishNode.row) <= bufferZone && Math.abs(col - finishNode.col) <= bufferZone)
      ) {
        continue;
      }
      
      // Create walls with a 25% probability
      if (Math.random() < 0.25) {
        newGrid[row][col].isWall = true;
      }
    }
  }
  
  return newGrid;
};

/**
 * Generate a maze using recursive division
 */
export const generateRecursiveDivisionMaze = (
  grid: GridNode[][],
  startNode: {row: number, col: number},
  finishNode: {row: number, col: number},
  height: number,
  width: number
) => {
  const newGrid = [...grid];
  
  // Clear any existing walls first
  for (let row = 0; row < newGrid.length; row++) {
    for (let col = 0; col < newGrid[0].length; col++) {
      newGrid[row][col].isWall = false;
    }
  }
  
  // Add outer walls
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
        if (
          !(row === startNode.row && col === startNode.col) &&
          !(row === finishNode.row && col === finishNode.col)
        ) {
          newGrid[row][col].isWall = true;
        }
      }
    }
  }
  
  // Start the recursive division
  recursiveDivisionMaze(
    newGrid,
    1, 
    height - 2, 
    1, 
    width - 2, 
    chooseOrientation(height - 2, width - 2),
    startNode,
    finishNode
  );
  
  return newGrid;
};

/**
 * Helper function to choose orientation based on chamber dimensions
 */
const chooseOrientation = (height: number, width: number) => {
  // In case the area is a perfect square, choose randomly
  if (height === width) {
    return Math.random() < 0.5 ? 'horizontal' : 'vertical';
  }
  
  // If the area is wider than it is tall, prefer a vertical wall
  // If the area is taller than it is wide, prefer a horizontal wall
  return height < width ? 'vertical' : 'horizontal';
};

/**
 * Recursive division maze algorithm
 */
const recursiveDivisionMaze = (
  grid: GridNode[][],
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number,
  orientation: string,
  startNode: {row: number, col: number},
  finishNode: {row: number, col: number}
) => {
  // Base case: if the area is too small, stop recursion
  if (rowEnd - rowStart < 2 || colEnd - colStart < 2) {
    return;
  }
  
  // Variables that decide where to build the walls
  let wallRow = 0;
  let wallCol = 0;
  let passageRow = 0;
  let passageCol = 0;
  
  // Build the wall in the appropriate orientation
  if (orientation === 'horizontal') {
    // Choose a random row for the wall (not on the edge)
    wallRow = Math.floor(Math.random() * (rowEnd - rowStart - 1)) + rowStart + 1;
    
    // Choose a random passage through the wall
    passageCol = Math.floor(Math.random() * (colEnd - colStart + 1)) + colStart;
    
    // Build the wall with a passage
    for (let col = colStart; col <= colEnd; col++) {
      // Skip if it's the passage or if it would make a start/finish node into a wall
      if (
        col === passageCol ||
        (wallRow === startNode.row && col === startNode.col) ||
        (wallRow === finishNode.row && col === finishNode.col)
      ) {
        continue;
      }
      
      // Check if making this a wall would create double walls
      if (
        (wallRow > 0 && grid[wallRow - 1][col].isWall) ||
        (wallRow < grid.length - 1 && grid[wallRow + 1][col].isWall)
      ) {
        // Skip creating this wall segment
        continue;
      }
      
      grid[wallRow][col].isWall = true;
    }
    
    // Recursively divide the two new chambers
    const newOrientationTop = chooseOrientation(wallRow - rowStart, colEnd - colStart);
    const newOrientationBottom = chooseOrientation(rowEnd - wallRow, colEnd - colStart);
    
    recursiveDivisionMaze(grid, rowStart, wallRow - 1, colStart, colEnd, newOrientationTop, startNode, finishNode);
    recursiveDivisionMaze(grid, wallRow + 1, rowEnd, colStart, colEnd, newOrientationBottom, startNode, finishNode);
  } else {
    // Choose a random column for the wall (not on the edge)
    wallCol = Math.floor(Math.random() * (colEnd - colStart - 1)) + colStart + 1;
    
    // Choose a random passage through the wall
    passageRow = Math.floor(Math.random() * (rowEnd - rowStart + 1)) + rowStart;
    
    // Build the wall with a passage
    for (let row = rowStart; row <= rowEnd; row++) {
      // Skip if it's the passage or if it would make a start/finish node into a wall
      if (
        row === passageRow ||
        (row === startNode.row && wallCol === startNode.col) ||
        (row === finishNode.row && wallCol === finishNode.col)
      ) {
        continue;
      }
      
      // Check if making this a wall would create double walls
      if (
        (wallCol > 0 && grid[row][wallCol - 1].isWall) ||
        (wallCol < grid[0].length - 1 && grid[row][wallCol + 1].isWall)
      ) {
        // Skip creating this wall segment
        continue;
      }
      
      grid[row][wallCol].isWall = true;
    }
    
    // Recursively divide the two new chambers
    const newOrientationLeft = chooseOrientation(rowEnd - rowStart, wallCol - colStart);
    const newOrientationRight = chooseOrientation(rowEnd - rowStart, colEnd - wallCol);
    
    recursiveDivisionMaze(grid, rowStart, rowEnd, colStart, wallCol - 1, newOrientationLeft, startNode, finishNode);
    recursiveDivisionMaze(grid, rowStart, rowEnd, wallCol + 1, colEnd, newOrientationRight, startNode, finishNode);
  }
};

/**
 * Generate a maze using randomized DFS (recursive backtracker)
 */
export const generateDFSMaze = (
  grid: GridNode[][],
  startNode: {row: number, col: number},
  finishNode: {row: number, col: number}
) => {
  const newGrid = grid.map(row => row.map(node => ({ ...node, isWall: true })));
  const rows = newGrid.length;
  const cols = newGrid[0].length;
  const visited = new Set<string>();
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  const carve = (r: number, c: number) => {
    visited.add(`${r},${c}`);
    newGrid[r][c].isWall = false;
    // shuffle directions
    dirs.sort(() => Math.random() - 0.5).forEach(([dr, dc]) => {
      const nr = r + dr*2;
      const nc = c + dc*2;
      if (nr > 0 && nr < rows && nc > 0 && nc < cols && !visited.has(`${nr},${nc}`)) {
        // remove wall between
        newGrid[r + dr][c + dc].isWall = false;
        carve(nr, nc);
      }
    });
  };
  // start carving at startNode
  carve(startNode.row, startNode.col);
  // ensure finish reachable: carve straight corridor
  let cr = startNode.row, cc = startNode.col;
  while (cr !== finishNode.row) {
    const dr = finishNode.row > cr ? 1 : -1;
    newGrid[cr + dr][cc].isWall = false;
    cr += dr;
  }
  while (cc !== finishNode.col) {
    const dc = finishNode.col > cc ? 1 : -1;
    newGrid[cr][cc + dc].isWall = false;
    cc += dc;
  }
  // restore special nodes
  newGrid[startNode.row][startNode.col].isWall = false;
  newGrid[finishNode.row][finishNode.col].isWall = false;
  return newGrid;
};

/**
 * Generate a maze using Prim's algorithm
 */
export const generatePrimsMaze = (
  grid: GridNode[][],
  startNode: {row: number, col: number},
  finishNode: {row: number, col: number}
) => {
  const newGrid = grid.map(row => row.map(node => ({ ...node, isWall: true })));
  const rows = newGrid.length, cols = newGrid[0].length;
  const inBounds = (r: number, c: number) => r>0 && r<rows && c>0 && c<cols;
  const frontiers: [number,number,number,number][] = [];
  // add neighbor walls of start
  const addFrontier = (r: number, c: number) => {
    [[-2,0],[2,0],[0,-2],[0,2]].forEach(([dr,dc]) => {
      const nr = r+dr, nc = c+dc;
      if(inBounds(nr,nc) && newGrid[nr][nc].isWall) frontiers.push([r,c,nr,nc]);
    });
  };
  newGrid[startNode.row][startNode.col].isWall = false;
  addFrontier(startNode.row, startNode.col);
  while(frontiers.length){
    const idx = Math.floor(Math.random()*frontiers.length);
    const [pr,pc,cr,cc] = frontiers.splice(idx,1)[0];
    if(newGrid[cr][cc].isWall){
      newGrid[(pr+cr)/2][(pc+cc)/2].isWall = false;
      newGrid[cr][cc].isWall = false;
      addFrontier(cr,cc);
    }
  }
  // carve path to finish if isolated
  let r = startNode.row, c = startNode.col;
  while(r!==finishNode.row){ const dr = finishNode.row>r?1:-1; newGrid[r+dr][c].isWall=false; r+=dr; }
  while(c!==finishNode.col){ const dc = finishNode.col>c?1:-1; newGrid[r][c+dc].isWall=false; c+=dc; }
  newGrid[finishNode.row][finishNode.col].isWall=false;
  return newGrid;
};

/**
 * Generate a maze using Kruskal's algorithm
 */
export const generateKruskalMaze = (
  grid: GridNode[][],
  startNode: {row: number, col: number},
  finishNode: {row: number, col: number}
) => {
  const newGrid = grid.map(row => row.map(node => ({ ...node, isWall: true })));
  const rows = newGrid.length, cols = newGrid[0].length;
  // DSU setup
  const parent = new Array(rows*cols).fill(0).map((_,i)=>i);
  const find = (x: number): number => parent[x]===x?x:parent[x]=find(parent[x]);
  const union = (a: number, b: number) => { parent[find(a)]=find(b); };
  // collect edges between cells (odd-even grid)
  const edges: [number,number,number,number][] = [];
  for(let r=1;r<rows;r+=2) for(let c=1;c<cols;c+=2){
    const id = r*cols+c;
    newGrid[r][c].isWall=false;
    [[2,0],[0,2]].forEach(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(nr<rows&&nc<cols){ edges.push([r,c,nr,nc]); }
    });
  }
  // shuffle edges
  edges.sort(()=>Math.random()-0.5);
  edges.forEach(([r1,c1,r2,c2])=>{
    const id1=r1*cols+c1, id2=r2*cols+c2;
    if(find(id1)!==find(id2)){
      union(id1,id2);
      newGrid[(r1+r2)/2][(c1+c2)/2].isWall=false;
    }
  });
  // ensure connectivity to finish
  let r = startNode.row, c = startNode.col;
  while(r!==finishNode.row){ const dr = finishNode.row>r?1:-1; newGrid[r+dr][c].isWall=false; r+=dr; }
  while(c!==finishNode.col){ const dc = finishNode.col>c?1:-1; newGrid[r][c+dc].isWall=false; c+=dc; }
  newGrid[finishNode.row][finishNode.col].isWall=false;
  return newGrid;
};
import { useState, useCallback } from 'react';
import type { GridNode } from '../components/types';

/**
 * Custom hook for grid operations that abstracts grid state management
 */
export default function useGridOperations(
  rows: number,
  cols: number,
  startNode: { row: number, col: number },
  finishNode: { row: number, col: number },
  foodNodes: { row: number, col: number }[]
) {
  const [grid, setGrid] = useState<GridNode[][]>([]);

  /**
   * Create a node with default values
   */
  const createNode = useCallback((row: number, col: number): GridNode => {
    return {
      row,
      col,
      isStart: row === startNode.row && col === startNode.col,
      isFinish: row === finishNode.row && col === finishNode.col,
      isFood: foodNodes.some(food => food.row === row && food.col === col),
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
  }, [startNode, finishNode, foodNodes]);

  /**
   * Initialize grid with new nodes or use provided grid
   */
  const initializeGrid = useCallback((initialGrid?: GridNode[][]) => {
    if (initialGrid) {
      setGrid(initialGrid);
      return;
    }

    const newGrid: GridNode[][] = [];
    for (let row = 0; row < rows; row++) {
      const currentRow: GridNode[] = [];
      for (let col = 0; col < cols; col++) {
        currentRow.push(createNode(row, col));
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
  }, [rows, cols, createNode]);

  /**
   * Update a specific node in the grid
   */
  const updateNodeInGrid = useCallback((row: number, col: number, newNode: GridNode) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      newGrid[row][col] = newNode;
      return newGrid;
    });
  }, [rows, cols]);

  /**
   * Clear the entire board
   */
  const clearBoard = useCallback(() => {
    initializeGrid();
  }, [initializeGrid]);

  /**
   * Clear only walls and weights
   */
  const clearWallsAndWeights = useCallback(() => {
    setGrid(prevGrid => 
      prevGrid.map(row =>
        row.map(node => ({
          ...node,
          isWall: false,
          isWeight: false,
          weightValue: 1,
        }))
      )
    );
  }, []);

  /**
   * Clear only the path visualization
   */
  const clearPath = useCallback(() => {
    setGrid(prevGrid => 
      prevGrid.map(row =>
        row.map(node => ({
          ...node,
          isVisited: false,
          distance: Infinity,
          previousNode: null,
          isShortest: false,
          heuristic: 0,
          fScore: Infinity,
        }))
      )
    );
  }, []);

  return {
    grid,
    setGrid,
    initializeGrid,
    createNode,
    updateNodeInGrid,
    clearBoard,
    clearWallsAndWeights,
    clearPath
  };
} 
import type { GridNode } from './GridModel';
import { eventBus, EVENTS } from './EventBus';

/**
 * Speed presets for animations
 */
export enum AnimationSpeed {
  SLOW = 'slow',
  MEDIUM = 'medium',
  FAST = 'fast'
}

/**
 * Visualization states
 */
export enum VisualizationState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

/**
 * Visualization options
 */
export interface VisualizationOptions {
  /** Animation speed */
  speed: AnimationSpeed;
  /** Whether to show step-by-step annotations */
  showAnnotations?: boolean;
  /** Custom CSS class for visited nodes */
  visitedClassName?: string;
  /** Custom CSS class for shortest path nodes */
  shortestPathClassName?: string;
}

/**
 * VisualizationEngine - Handles animation and DOM manipulation
 * 
 * This class is responsible for animating algorithm results and
 * directly manipulating the DOM for efficient visualization.
 */
export class VisualizationEngine {
  private visitedNodesInOrder: GridNode[] = [];
  private shortestPathNodesInOrder: GridNode[] = [];
  private animationState: VisualizationState = VisualizationState.IDLE;
  private visitedTimeouts: number[] = [];
  private shortestPathTimeouts: number[] = [];
  private currentVisitedIndex: number = 0;
  private currentShortestPathIndex: number = 0;
  private options: VisualizationOptions;
  
  constructor(options: Partial<VisualizationOptions> = {}) {
    this.options = {
      speed: options.speed || AnimationSpeed.MEDIUM,
      showAnnotations: options.showAnnotations || false,
      visitedClassName: options.visitedClassName || 'node-visited',
      shortestPathClassName: options.shortestPathClassName || 'node-shortest-path'
    };
    
    // Subscribe to speed change events
    eventBus.subscribe(EVENTS.ANIMATION_SPEED_CHANGED, (data) => {
      this.options.speed = data.speed;
    });
  }
  
  /**
   * Set the algorithm results to visualize
   */
  setAlgorithmResults(visitedNodes: GridNode[], shortestPathNodes: GridNode[]): void {
    this.reset();
    this.visitedNodesInOrder = [...visitedNodes];
    this.shortestPathNodesInOrder = [...shortestPathNodes];
  }
  
  /**
   * Start or resume the visualization
   */
  start(): void {
    if (this.animationState === VisualizationState.RUNNING) {
      return;
    }
    
    console.log('VisualizationEngine: Starting visualization');
    console.log('Nodes to visualize:', {
      visited: this.visitedNodesInOrder.length,
      shortestPath: this.shortestPathNodesInOrder.length
    });
    
    this.animationState = VisualizationState.RUNNING;
    eventBus.publish(EVENTS.VISUALIZATION_STARTED);
    
    if (this.currentVisitedIndex < this.visitedNodesInOrder.length) {
      this.animateVisitedNodes();
    } else if (this.currentShortestPathIndex < this.shortestPathNodesInOrder.length) {
      this.animateShortestPath();
    } else {
      this.complete();
    }
  }
  
  /**
   * Pause the visualization
   */
  pause(): void {
    if (this.animationState !== VisualizationState.RUNNING) {
      return;
    }
    
    this.animationState = VisualizationState.PAUSED;
    eventBus.publish(EVENTS.VISUALIZATION_STOPPED, { 
      state: this.animationState,
      visitedProgress: this.currentVisitedIndex,
      shortestPathProgress: this.currentShortestPathIndex
    });
    
    // Clear all active timeouts
    this.clearTimeouts();
  }
  
  /**
   * Stop the visualization and clear all visualizations
   */
  stop(): void {
    // Skip if already idle to prevent extra events
    if (this.animationState === VisualizationState.IDLE) {
      return;
    }
    
    this.clearTimeouts();
    this.clearVisualization();
    
    // Store current state to avoid multiple events
    const previousState = this.animationState;
    
    // Update internal state
    this.currentVisitedIndex = 0;
    this.currentShortestPathIndex = 0;
    this.animationState = VisualizationState.IDLE;
    
    // Only publish event if we were previously not in IDLE state
    if (previousState !== VisualizationState.IDLE) {
      eventBus.publish(EVENTS.VISUALIZATION_STOPPED, { 
        state: VisualizationState.IDLE
      });
    }
  }
  
  /**
   * Reset the visualization to the beginning
   */
  reset(): void {
    // Skip if already in IDLE state
    if (this.animationState === VisualizationState.IDLE &&
        this.currentVisitedIndex === 0 &&
        this.currentShortestPathIndex === 0) {
      return;
    }
    
    this.clearTimeouts();
    this.currentVisitedIndex = 0;
    this.currentShortestPathIndex = 0;
    this.animationState = VisualizationState.IDLE;
  }
  
  /**
   * Clear visualization by removing all visual effects
   */
  clearVisualization(): void {
    document.querySelectorAll(`.${this.options.visitedClassName}, .${this.options.shortestPathClassName}`)
      .forEach(element => {
        element.classList.remove(
          this.options.visitedClassName!, 
          this.options.shortestPathClassName!
        );
      });
  }
  
  /**
   * Get the current speed in milliseconds
   */
  private getSpeedFactor(): number {
    switch (this.options.speed) {
      case AnimationSpeed.SLOW:
        return 100;
      case AnimationSpeed.MEDIUM:
        return 50;
      case AnimationSpeed.FAST:
        return 10;
      default:
        return 50;
    }
  }
  
  /**
   * Get node element by its row and column
   */
  private getNodeElement(row: number, col: number): HTMLElement | null {
    const element = document.getElementById(`node-${row}-${col}`);
    if (!element) {
      console.warn(`Could not find node element with id: node-${row}-${col}`);
    }
    return element;
  }
  
  /**
   * Animate visited nodes
   */
  private animateVisitedNodes(): void {
    if (this.animationState !== VisualizationState.RUNNING) {
      console.log('VisualizationEngine: Not animating visited nodes, state is not RUNNING');
      return;
    }
    
    console.log('VisualizationEngine: Animating visited nodes', 
      this.currentVisitedIndex, 'to', this.visitedNodesInOrder.length - 1);
    
    const speedFactor = this.getSpeedFactor();
    
    for (let i = this.currentVisitedIndex; i < this.visitedNodesInOrder.length; i++) {
      const timeout = window.setTimeout(() => {
        if (this.animationState !== VisualizationState.RUNNING) {
          return;
        }
        
        const node = this.visitedNodesInOrder[i];
        const element = this.getNodeElement(node.row, node.col);
        
        if (element) {
          console.log(`VisualizationEngine: Adding visited class to node-${node.row}-${node.col}`);
          
          // Apply the class and also force the element's style directly
          element.classList.add(this.options.visitedClassName!);
          element.style.backgroundColor = 'rgba(0, 158, 255, 0.8)';
          
          eventBus.publish(EVENTS.VISUALIZATION_STEP, {
            type: 'visited',
            node,
            index: i,
            total: this.visitedNodesInOrder.length
          });
        }
        
        this.currentVisitedIndex = i + 1;
        
        // If this was the last node, start animating the shortest path
        if (i === this.visitedNodesInOrder.length - 1) {
          console.log('VisualizationEngine: Finished animating visited nodes, moving to shortest path');
          // Add a slight delay before starting shortest path animation
          window.setTimeout(() => {
            this.animateShortestPath();
          }, speedFactor * 2);
        }
      }, speedFactor * (i - this.currentVisitedIndex));
      
      this.visitedTimeouts.push(timeout);
    }
  }
  
  /**
   * Animate shortest path
   */
  private animateShortestPath(): void {
    if (this.animationState !== VisualizationState.RUNNING) {
      console.log('VisualizationEngine: Not animating shortest path, state is not RUNNING');
      return;
    }
    
    // If there's no shortest path, complete the visualization
    if (this.shortestPathNodesInOrder.length === 0) {
      console.log('VisualizationEngine: No shortest path to animate');
      this.complete();
      return;
    }
    
    console.log('VisualizationEngine: Animating shortest path', 
      this.currentShortestPathIndex, 'to', this.shortestPathNodesInOrder.length - 1);
    
    const speedFactor = this.getSpeedFactor() * 2; // Slower for better visibility
    
    for (let i = this.currentShortestPathIndex; i < this.shortestPathNodesInOrder.length; i++) {
      const timeout = window.setTimeout(() => {
        if (this.animationState !== VisualizationState.RUNNING) {
          return;
        }
        
        const node = this.shortestPathNodesInOrder[i];
        const element = this.getNodeElement(node.row, node.col);
        
        if (element) {
          console.log(`VisualizationEngine: Adding shortest path class to node-${node.row}-${node.col}`);
          
          // Apply the class and also force the element's style directly
          element.classList.add(this.options.shortestPathClassName!);
          element.style.backgroundColor = 'rgba(255, 207, 0, 1)';
          
          eventBus.publish(EVENTS.VISUALIZATION_STEP, {
            type: 'shortest',
            node,
            index: i,
            total: this.shortestPathNodesInOrder.length
          });
        }
        
        this.currentShortestPathIndex = i + 1;
        
        // If this was the last node, complete the visualization
        if (i === this.shortestPathNodesInOrder.length - 1) {
          console.log('VisualizationEngine: Finished animating shortest path');
          this.complete();
        }
      }, speedFactor * (i - this.currentShortestPathIndex));
      
      this.shortestPathTimeouts.push(timeout);
    }
  }
  
  /**
   * Complete the visualization
   */
  private complete(): void {
    this.animationState = VisualizationState.COMPLETED;
    eventBus.publish(EVENTS.VISUALIZATION_COMPLETED, {
      visitedNodesCount: this.visitedNodesInOrder.length,
      shortestPathNodesCount: this.shortestPathNodesInOrder.length
    });
  }
  
  /**
   * Clear all animation timeouts
   */
  private clearTimeouts(): void {
    this.visitedTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.shortestPathTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.visitedTimeouts = [];
    this.shortestPathTimeouts = [];
  }
  
  /**
   * Get current visualization state
   */
  getState(): VisualizationState {
    return this.animationState;
  }
  
  /**
   * Get current visualization progress
   */
  getProgress(): { 
    visitedProgress: number,
    visitedTotal: number,
    shortestPathProgress: number, 
    shortestPathTotal: number 
  } {
    return {
      visitedProgress: this.currentVisitedIndex,
      visitedTotal: this.visitedNodesInOrder.length,
      shortestPathProgress: this.currentShortestPathIndex,
      shortestPathTotal: this.shortestPathNodesInOrder.length
    };
  }
  
  /**
   * Set animation speed
   */
  setSpeed(speed: AnimationSpeed): void {
    this.options.speed = speed;
  }
  
  /**
   * Test animation - applies animations directly to specific nodes
   * This is a debugging tool to ensure CSS animations can be applied correctly
   */
  testAnimation(): void {
    console.log('VisualizationEngine: Running animation test');
    
    // Clear any existing animations
    this.clearVisualization();
    
    // Get some nodes to test with - a 3x3 area in the middle of the grid
    const testNodes = [];
    for (let r = 10; r < 13; r++) {
      for (let c = 15; c < 18; c++) {
        testNodes.push({row: r, col: c});
      }
    }
    
    console.log('VisualizationEngine: Testing with nodes:', testNodes);
    
    // Apply visited animation to the test nodes with a delay between each
    testNodes.forEach((node, index) => {
      setTimeout(() => {
        const element = this.getNodeElement(node.row, node.col);
        if (element) {
          console.log(`VisualizationEngine: Applying visited class to node-${node.row}-${node.col}`);
          element.classList.add(this.options.visitedClassName!);
        } else {
          console.error(`VisualizationEngine: Could not find element for node-${node.row}-${node.col}`);
        }
      }, index * 300);
    });
    
    // Apply shortest path animation to a line of nodes after a delay
    setTimeout(() => {
      console.log('VisualizationEngine: Testing shortest path animation');
      for (let c = 15; c < 18; c++) {
        const element = this.getNodeElement(11, c);
        if (element) {
          element.classList.add(this.options.shortestPathClassName!);
        }
      }
    }, testNodes.length * 300 + 500);
  }
} 
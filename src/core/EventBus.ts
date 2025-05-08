/**
 * EventBus - A simple event bus for decoupled communication
 * 
 * This enables different parts of the application to communicate 
 * without direct dependencies on each other.
 */

export type EventCallback = (data: any) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};
  private eventStack: string[] = []; // Track event call stack to detect circular dependencies
  private isDispatching: boolean = false;
  private maxStackDepth: number = 10; // Limit the depth of event propagation
  
  /**
   * Subscribe to an event
   * 
   * @param eventName The name of the event to subscribe to
   * @param callback Function to be called when the event occurs
   * @returns A function to unsubscribe from the event
   */
  subscribe(eventName: string, callback: EventCallback): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    
    this.events[eventName].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Publish an event
   * 
   * @param eventName The name of the event to publish
   * @param data Data to pass to the subscribers
   * @returns True if event was successfully published
   */
  publish(eventName: string, data: any = {}): boolean {
    if (!this.events[eventName]) {
      return false;
    }
    
    // Prevent circular event dependencies
    if (this.eventStack.includes(eventName)) {
      console.warn(`Circular event dependency detected for event: ${eventName}. Event stack:`, [...this.eventStack]);
      return false;
    }
    
    // Check stack depth to prevent infinite loops
    if (this.eventStack.length >= this.maxStackDepth) {
      console.error(`Maximum event stack depth reached. Stopping event propagation to prevent infinite loops. Current stack:`, [...this.eventStack]);
      return false;
    }
    
    try {
      // Track that we're entering this event
      this.eventStack.push(eventName);
      
      // Set flag to indicate we're dispatching events
      const wasDispatching = this.isDispatching;
      this.isDispatching = true;
      
      this.events[eventName].forEach(callback => {
        callback(data);
      });
      
      // Reset dispatching flag only if we're the outermost dispatch call
      if (!wasDispatching) {
        this.isDispatching = false;
      }
      
      return true;
    } finally {
      // Always make sure to pop the event from the stack
      if (this.eventStack[this.eventStack.length - 1] === eventName) {
        this.eventStack.pop();
      }
      
      // If we've processed all events, clear the stack completely
      if (this.eventStack.length === 0) {
        this.isDispatching = false;
      }
    }
  }
  
  /**
   * Remove all subscribers for a specific event
   * 
   * @param eventName The name of the event to clear
   */
  clear(eventName: string): void {
    delete this.events[eventName];
  }
  
  /**
   * Remove all subscribers for all events
   */
  clearAll(): void {
    this.events = {};
    this.eventStack = [];
    this.isDispatching = false;
  }
}

// Create a singleton instance
export const eventBus = new EventBus();

// Event name constants
export const EVENTS = {
  // Grid events
  GRID_INITIALIZED: 'grid:initialized',
  GRID_NODE_CHANGED: 'grid:nodeChanged',
  GRID_RESET: 'grid:reset',
  
  // Algorithm events
  ALGORITHM_STARTED: 'algorithm:started',
  ALGORITHM_STEP: 'algorithm:step',
  ALGORITHM_COMPLETED: 'algorithm:completed',
  ALGORITHM_STOPPED: 'algorithm:stopped',
  
  // Visualization events
  VISUALIZATION_STARTED: 'visualization:started',
  VISUALIZATION_STEP: 'visualization:step',
  VISUALIZATION_COMPLETED: 'visualization:completed',
  VISUALIZATION_STOPPED: 'visualization:stopped',
  
  // Interaction events
  TOOL_CHANGED: 'interaction:toolChanged',
  NODE_CLICKED: 'interaction:nodeClicked',
  NODE_DRAGGED: 'interaction:nodeDragged',
  NODE_MOVED: 'interaction:nodeMoved',
  
  // UI events
  ANIMATION_SPEED_CHANGED: 'ui:animationSpeedChanged',
  ALGORITHM_CHANGED: 'ui:algorithmChanged',
  MAZE_GENERATION_REQUESTED: 'ui:mazeGenerationRequested',
  
  // Path events
  RECALCULATE_PATH_REQUESTED: 'path:recalculateRequested',
  PATH_UPDATED: 'path:updated'
}; 
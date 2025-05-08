/**
 * EventBus - A simple event bus for decoupled communication
 * 
 * This enables different parts of the application to communicate 
 * without direct dependencies on each other.
 */

export type EventCallback = (data: any) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};
  
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
   */
  publish(eventName: string, data: any = {}): void {
    if (!this.events[eventName]) {
      return;
    }
    
    this.events[eventName].forEach(callback => {
      callback(data);
    });
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
  
  // UI events
  ANIMATION_SPEED_CHANGED: 'ui:animationSpeedChanged',
  ALGORITHM_CHANGED: 'ui:algorithmChanged',
  MAZE_GENERATION_REQUESTED: 'ui:mazeGenerationRequested',
}; 
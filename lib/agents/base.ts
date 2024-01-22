// Base Agent Interface - Initial Prototype
export interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(input: string): Promise<string>;
  
  // TODO: Add workflow orchestration
  // TODO: Add state management  
  // TODO: Add error handling
}
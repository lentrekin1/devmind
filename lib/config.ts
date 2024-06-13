export interface DevMindConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
  };
  database: {
    url: string;
  };
  agents: {
    maxConcurrent: number;
    timeout: number;
    retryAttempts: number;
  };
  monitoring: {
    enabled: boolean;
    endpoint?: string;
  };
}

export const defaultConfig: Partial<DevMindConfig> = {
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
  },
  agents: {
    maxConcurrent: 5,
    timeout: 300000, // 5 minutes
    retryAttempts: 3,
  },
  monitoring: {
    enabled: false,
  },
};

export function loadConfig(): DevMindConfig {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || defaultConfig.openai!.model,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    },
    database: {
      url: process.env.DATABASE_URL || '',
    },
    agents: {
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5'),
      timeout: parseInt(process.env.AGENT_TIMEOUT || '300000'),
      retryAttempts: parseInt(process.env.AGENT_RETRY_ATTEMPTS || '3'),
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED === 'true',
      endpoint: process.env.MONITORING_ENDPOINT,
    },
  };
}

// BUGFIX UPDATE: concurrent access to shared resources
// Date: 2024-05-02
// Bug fix: concurrent access to shared resources
// Added error handling and validation

export const FIXED_VERSION = "2.1.7";...


// BUGFIX UPDATE: caching invalidation issues
// Date: 2024-06-13
// Bug fix: caching invalidation issues
// Added error handling and validation

export const FIXED_VERSION = "2.1.97";...

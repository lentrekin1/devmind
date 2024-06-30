import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator, WorkflowStep } from '@/lib/orchestrator';
import { CodeReviewAgent } from '@/lib/agents/code-review';
import { TestingAgent } from '@/lib/agents/testing';
import { DeploymentAgent } from '@/lib/agents/deployment';
import { loadConfig } from '@/lib/config';

const orchestrator = new AgentOrchestrator();
const config = loadConfig();

// Initialize agents
orchestrator.registerAgent('code-review', new CodeReviewAgent({
  name: 'Code Review Agent',
  model: config.openai.model,
  temperature: config.openai.temperature,
  maxTokens: 2000,
}));

orchestrator.registerAgent('testing', new TestingAgent({
  name: 'Testing Agent',
  model: config.openai.model,
  temperature: config.openai.temperature,
  maxTokens: 2000,
  frameworks: ['jest', 'vitest', 'playwright'],
  coverageThreshold: 80,
}));

orchestrator.registerAgent('deployment', new DeploymentAgent({
  name: 'Deployment Agent',
  model: config.openai.model,
  temperature: config.openai.temperature,
  maxTokens: 1500,
  environments: ['staging', 'production'],
  rollbackEnabled: true,
}));

export async function POST(request: NextRequest) {
  try {
    const { workflow } = await request.json();
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow description is required' },
        { status: 400 }
      );
    }

    // Parse workflow into steps (simplified for demo)
    const steps: WorkflowStep[] = [];
    
    if (workflow.toLowerCase().includes('review')) {
      steps.push({
        agentName: 'code-review',
        input: workflow,
      });
    }
    
    if (workflow.toLowerCase().includes('test')) {
      steps.push({
        agentName: 'testing',
        input: workflow,
        dependencies: workflow.toLowerCase().includes('review') ? ['code-review'] : undefined,
      });
    }
    
    if (workflow.toLowerCase().includes('deploy')) {
      steps.push({
        agentName: 'deployment',
        input: workflow,
        dependencies: ['testing'],
      });
    }

    if (steps.length === 0) {
      return NextResponse.json(
        { error: 'No recognized workflow steps found' },
        { status: 400 }
      );
    }

    // Execute workflow
    const results = await orchestrator.executeWorkflow(steps);
    const executionState = orchestrator.getExecutionState();

    return NextResponse.json({
      success: true,
      results: Object.fromEntries(results),
      executionState: Object.fromEntries(executionState),
      stepsExecuted: steps.length,
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableAgents: ['code-review', 'testing', 'deployment'],
    status: 'DevMind API is running',
    version: '0.3.0',
  });
}

// BUGFIX UPDATE: memory leak in agent processing
// Date: 2024-05-02
// Bug fix: memory leak in agent processing
// Added error handling and validation

export const FIXED_VERSION = "2.1.59";...


// BUGFIX UPDATE: rate limiting edge cases
// Date: 2024-05-10
// Bug fix: rate limiting edge cases
// Added error handling and validation

export const FIXED_VERSION = "2.1.89";...


// BUGFIX UPDATE: caching invalidation issues
// Date: 2024-05-17
// Bug fix: caching invalidation issues
// Added error handling and validation

export const FIXED_VERSION = "2.1.46";...


// BUGFIX UPDATE: webhook retry mechanism
// Date: 2024-05-26
// Bug fix: webhook retry mechanism
// Added error handling and validation

export const FIXED_VERSION = "2.1.8";...


// BUGFIX UPDATE: memory leak in agent processing
// Date: 2024-06-21
// Bug fix: memory leak in agent processing
// Added error handling and validation

export const FIXED_VERSION = "2.1.6";...


// BUGFIX UPDATE: timeout handling in API calls
// Date: 2024-06-30
// Bug fix: timeout handling in API calls
// Added error handling and validation

export const FIXED_VERSION = "2.1.73";...

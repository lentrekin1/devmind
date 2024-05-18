import { AgentOrchestrator } from '@/lib/orchestrator'
import { BaseAgent } from '@/lib/agents/base'

class MockAgent extends BaseAgent {
  async execute(input: string): Promise<string> {
    return `Mock result for: ${input}`
  }
}

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator
  let mockAgent: MockAgent

  beforeEach(() => {
    orchestrator = new AgentOrchestrator()
    mockAgent = new MockAgent({
      name: 'Mock Agent',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
    })
  })

  describe('registerAgent', () => {
    it('should register an agent successfully', () => {
      expect(() => {
        orchestrator.registerAgent('mock', mockAgent)
      }).not.toThrow()
    })
  })

  describe('executeWorkflow', () => {
    beforeEach(() => {
      orchestrator.registerAgent('mock', mockAgent)
    })

    it('should execute a single step workflow', async () => {
      const steps = [
        {
          agentName: 'mock',
          input: 'test input',
        },
      ]

      const results = await orchestrator.executeWorkflow(steps)
      expect(results.size).toBe(1)
      expect(results.get('mock')).toBe('Mock result for: test input')
    })

    it('should execute multiple steps in sequence', async () => {
      const steps = [
        {
          agentName: 'mock',
          input: 'first step',
        },
        {
          agentName: 'mock',
          input: 'second step',
        },
      ]

      const results = await orchestrator.executeWorkflow(steps)
      expect(results.size).toBe(2)
      expect(results.get('mock')).toBe('Mock result for: second step')
    })

    it('should throw error for unregistered agent', async () => {
      const steps = [
        {
          agentName: 'nonexistent',
          input: 'test input',
        },
      ]

      await expect(orchestrator.executeWorkflow(steps)).rejects.toThrow(
        'Agent nonexistent not found'
      )
    })

    it('should update execution state', async () => {
      const steps = [
        {
          agentName: 'mock',
          input: 'test input',
        },
      ]

      await orchestrator.executeWorkflow(steps)
      const state = orchestrator.getExecutionState()
      
      expect(state.has('mock')).toBe(true)
      expect(state.get('mock')).toEqual({
        status: 'completed',
        result: 'Mock result for: test input',
      })
    })
  })

  describe('getExecutionState', () => {
    it('should return empty state initially', () => {
      const state = orchestrator.getExecutionState()
      expect(state.size).toBe(0)
    })
  })
})
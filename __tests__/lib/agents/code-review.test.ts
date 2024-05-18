import { CodeReviewAgent } from '@/lib/agents/code-review'

describe('CodeReviewAgent', () => {
  let agent: CodeReviewAgent

  beforeEach(() => {
    agent = new CodeReviewAgent({
      name: 'Test Code Review Agent',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
    })
  })

  describe('execute', () => {
    it('should return a structured code review', async () => {
      const input = 'Please review my React component for security and performance'
      const result = await agent.execute(input)

      expect(result).toContain('Code Review Analysis')
      expect(result).toContain('Security Assessment')
      expect(result).toContain('Performance Review')
      expect(result).toContain('Best Practices')
      expect(result).toContain('Recommendations')
      expect(result).toContain('Overall Score')
    })

    it('should handle empty input gracefully', async () => {
      const result = await agent.execute('')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should provide security recommendations', async () => {
      const input = 'Review this authentication code'
      const result = await agent.execute(input)

      expect(result).toContain('Security Assessment')
      expect(result).toMatch(/(✅|⚠️|❌)/)
    })

    it('should include performance analysis', async () => {
      const input = 'Check performance of this database query'
      const result = await agent.execute(input)

      expect(result).toContain('Performance Review')
      expect(result).toContain('optimized')
    })

    it('should provide actionable recommendations', async () => {
      const input = 'Review API endpoint implementation'
      const result = await agent.execute(input)

      expect(result).toContain('Recommendations')
      expect(result).toMatch(/\d+\./g) // Should contain numbered recommendations
    })
  })
})
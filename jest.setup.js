import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.PINECONE_API_KEY = 'test-pinecone-key'
process.env.PINECONE_ENVIRONMENT = 'test-env'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Pinecone
jest.mock('pinecone-database', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    Index: jest.fn().mockReturnValue({
      query: jest.fn(),
      upsert: jest.fn(),
    }),
  })),
}))

// Global test timeout
jest.setTimeout(10000)
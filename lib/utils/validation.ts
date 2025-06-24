import { z } from 'zod';

// Workflow validation schemas
export const WorkflowStepSchema = z.object({
  agentName: z.string().min(1, 'Agent name is required'),
  input: z.string().min(1, 'Input is required'),
  dependencies: z.array(z.string()).optional(),
  config: z.record(z.any()).optional()
});

export const WorkflowRequestSchema = z.object({
  workflow: z.string().min(1, 'Workflow description is required'),
  steps: z.array(WorkflowStepSchema).optional(),
  metadata: z.object({
    userId: z.string().optional(),
    projectId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium')
  }).optional()
});

// User validation schemas  
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'viewer']),
  name: z.string().min(1).max(100)
});

export const CreateUserSchema = UserSchema.omit({ id: true });

// Agent configuration validation
export const AgentConfigSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8000),
  timeout: z.number().min(1000).max(300000).optional()
});

// API response validation
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional()
});

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Validation error: ${errorMessages}`);
    }
    throw error;
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}
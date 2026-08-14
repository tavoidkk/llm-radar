import { z } from 'zod';

const decimalString = z.string().regex(/^-?\d+(\.\d+)?$/);

export const OpenRouterPricingSchema = z.object({
  prompt: decimalString,
  completion: decimalString,
  request: decimalString.optional(),
  image: decimalString.optional(),
});

export const OpenRouterTopProviderSchema = z.object({
  name: z.string().optional(),
  context_length: z.number().int().nullable().optional(),
  max_completion_tokens: z.number().int().nullable().optional(),
  is_moderated: z.boolean().optional(),
});

export const OpenRouterArchitectureSchema = z.object({
  modality: z.string().optional(),
  input_modalities: z.array(z.string()).optional(),
  output_modalities: z.array(z.string()).optional(),
});

export const OpenRouterModelSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().nullable().optional(),
  context_length: z.number().int().nullable().optional(),
  pricing: OpenRouterPricingSchema,
  top_provider: OpenRouterTopProviderSchema.optional(),
  architecture: OpenRouterArchitectureSchema.optional(),
  homepage_url: z.string().nullable().optional(),
});

export const OpenRouterModelsResponseSchema = z.object({
  data: z.array(OpenRouterModelSchema),
});

export type OpenRouterModel = z.infer<typeof OpenRouterModelSchema>;
export type OpenRouterModelsResponse = z.infer<typeof OpenRouterModelsResponseSchema>;
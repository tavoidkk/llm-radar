import { z } from 'zod';

const nullableNumber = z.number().nullable().optional();
const nullableString = z.string().nullable().optional();

export const ArtificialAnalysisModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().optional(),
  release_date: nullableString,
  model_creator: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
    })
    .optional(),
  evaluations: z
    .object({
      artificial_analysis_intelligence_index: nullableNumber,
      artificial_analysis_coding_index: nullableNumber,
      artificial_analysis_math_index: nullableNumber,
      mmlu_pro: nullableNumber,
      gpqa: nullableNumber,
      hle: nullableNumber,
      livecodebench: nullableNumber,
      scicode: nullableNumber,
      math_500: nullableNumber,
      aime: nullableNumber,
      aime_25: nullableNumber,
      ifbench: nullableNumber,
      lcr: nullableNumber,
      terminalbench_hard: nullableNumber,
      terminalbench_v2_1: nullableNumber,
      tau2: nullableNumber,
      tau_banking: nullableNumber,
    })
    .default({}),
  pricing: z
    .object({
      price_1m_blended_3_to_1: z.number().optional(),
      price_1m_input_tokens: z.number().optional(),
      price_1m_output_tokens: z.number().optional(),
    })
    .default({}),
  median_output_tokens_per_second: z.number().optional(),
  median_time_to_first_token_seconds: z.number().optional(),
  median_time_to_first_answer_token: z.number().optional(),
});

export const ArtificialAnalysisResponseSchema = z.object({
  status: z.number().optional(),
  prompt_options: z.record(z.unknown()).optional(),
  data: z.array(ArtificialAnalysisModelSchema),
});

export type ArtificialAnalysisModel = z.infer<typeof ArtificialAnalysisModelSchema>;
export type ArtificialAnalysisResponse = z.infer<typeof ArtificialAnalysisResponseSchema>;

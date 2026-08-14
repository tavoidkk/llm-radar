export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      models: {
        Row: {
          id: string;
          name: string;
          provider: string;
          category: 'reasoning' | 'coding' | 'flash' | 'multimodal';
          context_window: number | null;
          homepage_url: string | null;
          max_output_tokens: number | null;
          input_modalities: string[];
          output_modalities: string[];
          modality: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          provider: string;
          category: 'reasoning' | 'coding' | 'flash' | 'multimodal';
          context_window?: number | null;
          homepage_url?: string | null;
          max_output_tokens?: number | null;
          input_modalities?: string[];
          output_modalities?: string[];
          modality?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['models']['Insert']>;
        Relationships: [];
      };
      metrics: {
        Row: {
          id: number;
          model_id: string;
          elo_rating: number;
          tokens_per_sec: number;
          cost_input: number;
          cost_output: number;
          latency_ms: number | null;
          source: 'openrouter' | 'artificial_analysis';
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          model_id: string;
          elo_rating: number;
          tokens_per_sec: number;
          cost_input: number;
          cost_output: number;
          latency_ms?: number | null;
          source: 'openrouter' | 'artificial_analysis';
          timestamp?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['metrics']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      v_latest_metrics: {
        Row: {
          model_id: string;
          model_name: string;
          provider: string;
          category: 'reasoning' | 'coding' | 'flash' | 'multimodal';
          elo_rating: number;
          tokens_per_sec: number;
          cost_input: number;
          cost_output: number;
          latency_ms: number | null;
          source: 'openrouter' | 'artificial_analysis';
          timestamp: string;
          context_window: number | null;
          homepage_url: string | null;
          max_output_tokens: number | null;
          input_modalities: string[];
          output_modalities: string[];
          modality: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
import { describe, it, expect } from 'vitest';
import { inferCategory, inferCategoryFromName, inferProvider } from './categorizer.js';

describe('categorizer', () => {
  describe('inferCategory (modality)', () => {
    it('maps text+image->text to multimodal', () => {
      expect(inferCategory('text+image->text')).toBe('multimodal');
    });
    it('maps text->text to reasoning', () => {
      expect(inferCategory('text->text')).toBe('reasoning');
    });
    it('returns fallback for unknown modalities', () => {
      expect(inferCategory('quantum->entanglement', 'flash')).toBe('flash');
    });
    it('returns fallback for missing modality', () => {
      expect(inferCategory(undefined, 'reasoning')).toBe('reasoning');
    });
  });

  describe('inferCategoryFromName', () => {
    it('detects multimodal models', () => {
      expect(inferCategoryFromName('GPT-4o vision preview')).toBe('multimodal');
      expect(inferCategoryFromName('claude-3-5-sonnet')).toBe('multimodal');
      expect(inferCategoryFromName('Gemini 1.5 Pro')).toBe('multimodal');
    });
    it('detects coding models', () => {
      expect(inferCategoryFromName('DeepSeek-Coder V2')).toBe('coding');
      expect(inferCategoryFromName('codestral-22b')).toBe('coding');
    });
    it('detects flash / low-latency models', () => {
      expect(inferCategoryFromName('Gemini 1.5 Flash')).toBe('flash');
      expect(inferCategoryFromName('GPT-4o mini')).toBe('flash');
      expect(inferCategoryFromName('Mistral-7B-Instruct')).toBe('flash');
    });
    it('returns undefined when no pattern matches', () => {
      expect(inferCategoryFromName('Some Unknown Model XYZ')).toBeUndefined();
    });
  });

  describe('inferProvider', () => {
    it('maps known providers', () => {
      expect(inferProvider('openai/gpt-4o')).toBe('OpenAI');
      expect(inferProvider('anthropic/claude-3-5-sonnet')).toBe('Anthropic');
      expect(inferProvider('google/gemini-pro')).toBe('Google');
      expect(inferProvider('meta-llama/llama-3-70b')).toBe('Meta');
      expect(inferProvider('mistralai/mistral-large')).toBe('Mistral');
      expect(inferProvider('deepseek/deepseek-chat')).toBe('DeepSeek');
      expect(inferProvider('xai/grok-1')).toBe('xAI');
    });
    it('capitalizes unknown providers', () => {
      expect(inferProvider('unknown-org/some-model')).toBe('Unknown-org');
    });
  });
});
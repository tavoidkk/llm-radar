import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./backend/vitest.setup.ts'],
    include: ['backend/src/**/*.test.ts', 'packages/types/**/*.test.ts', 'frontend/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/smoke/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['backend/src/**/*.ts', 'packages/types/src/**/*.ts', 'frontend/src/lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types/supabase.ts', '**/index.ts', '**/smoke/**'],
    },
  },
});
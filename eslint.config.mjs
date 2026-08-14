import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        WebSocket: 'readonly',
        JSX: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/smoke/**'],
  },
];
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'firestore.rules.test.ts',
      'src/**/__tests__/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});

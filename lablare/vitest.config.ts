import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Não rodar testes que dependem de DB no Vitest comum — eles precisam
    // de setup adicional (DATABASE_URL, migrações) e ficam em tests/integration
    // que serão habilitados em P2.
    exclude: ['tests/integration/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts', 'src/utils/**/*.ts'],
    },
  },
});

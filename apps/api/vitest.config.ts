import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: path.resolve(__dirname),
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts', 'test/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    },
    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
  },
})

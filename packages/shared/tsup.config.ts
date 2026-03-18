import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'constants/index': 'src/constants/index.ts',
    'validation/index': 'src/validation/index.ts',
    'fixtures/index': 'src/fixtures/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  clean: true,
  outDir: 'dist',
})

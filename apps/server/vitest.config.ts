import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    isolate: false,
    dir: 'src',
    globalSetup: ['./src/lib/db/PgliteDb.setup.ts'],
  },
});

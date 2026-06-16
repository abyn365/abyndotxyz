import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setupTests.ts'],
    // Allow synthetic imports of CSS modules etc.
    deps: {
      inline: ['@testing-library/react']
    }
  }
});

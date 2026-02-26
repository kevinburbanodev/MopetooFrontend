import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // The 'nuxt' environment resolves auto-imports, plugins, and Pinia
    // without spinning up a real server — correct for unit/integration tests.
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: '.',
      },
    },
    // Align with Nuxt's global helpers (ref, computed, etc.) so tests do not
    // need explicit imports for Vue reactivity primitives.
    globals: true,
    // Provide a stable API base URL for all tests without requiring mockNuxtImport
    // on useRuntimeConfig, which can interfere with Nuxt's internal router setup.
    env: {
      NUXT_PUBLIC_API_BASE: 'http://localhost:4000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      exclude: [
        // Client-only plugins — run at browser boot, not unit-testable in happy-dom
        '**/plugins/**',
        // Pure TypeScript type declarations — zero runtime logic
        '**/types/**',
        // Root app shell and layouts — no business logic
        'app/app.vue',
        'app/layouts/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})

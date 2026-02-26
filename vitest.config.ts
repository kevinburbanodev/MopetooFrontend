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
  },
})

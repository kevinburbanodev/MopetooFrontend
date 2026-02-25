// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  typescript: {
    strict: true,
  },

  css: ['~/assets/scss/main.scss'],

  modules: ['@pinia/nuxt'],

  components: [
    { path: '~/features', pathPrefix: false },
  ],

  imports: {
    dirs: [
      'features/*/composables',
      'features/*/stores',
      'features/shared/composables',
    ],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000',
      gaId: process.env.NUXT_PUBLIC_GA_ID || '',
      cdnBase: process.env.NUXT_PUBLIC_CDN_BASE || '',
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Silence Bootstrap 5 deprecation warnings caused by its legacy
          // @import / global-builtin / color-function API.
          // Bootstrap 6 will migrate to the modern @use/@forward API.
          silenceDeprecations: [
            'import',
            'global-builtin',
            'color-functions',
            'if-function',
          ],
        },
      },
    },
  },

  // SSR configuration
  ssr: true,

  // Route rules for caching, prerendering, and security headers
  routeRules: {
    // ── Security headers — applied to every route ─────────────────────────
    // These are a baseline. Add a proper CSP header once inline scripts are
    // audited (Bootstrap JS currently requires 'unsafe-inline' without a nonce).
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    // ── Caching ───────────────────────────────────────────────────────────
    // Cache blog pages for 1 hour
    '/blog/**': { cache: { maxAge: 60 * 60 } },
    // Cache shelters directory for 30 minutes
    '/shelter/**': { cache: { maxAge: 30 * 60 } },
    // Cache stores directory for 30 minutes
    '/stores/**': { cache: { maxAge: 30 * 60 } },
    // Cache clinics directory for 30 minutes
    '/clinics/**': { cache: { maxAge: 30 * 60 } },
  },
})

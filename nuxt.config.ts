// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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
})

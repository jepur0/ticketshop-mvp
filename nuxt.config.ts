// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  experimental: { appManifest: false },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    public: {
      seatsWorkspaceKey: process.env.NUXT_PUBLIC_SEATS_WORKSPACE_KEY || '',
      siteName: 'TicketShop',
      holdMinutes: 20
    }
  },
  nitro: {
    // sql.js ships wasm; keep external so Node can resolve locateFile
    externals: {
      traceInclude: ['node_modules/sql.js/**']
    },
    moduleSideEffects: ['sql.js']
  },
  vite: {
    optimizeDeps: {
      exclude: ['sql.js']
    }
  },
  app: {
    head: {
      title: 'TicketShop — Tickets online',
      htmlAttrs: { lang: 'de' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TicketShop MVP — Tickets für Konzerte und Events' },
        { name: 'theme-color', content: '#1d4ed8' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/scanner-192.png' }
      ]
    }
  }
})

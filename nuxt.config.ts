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
    // Keep sql.js external so Node can open the wasm from disk.
    // nft does not follow locateFile('sql-wasm.wasm'); the compiled hook
    // and the postbuild script copy that binary into the server output.
    externals: {
      traceInclude: ['sql.js']
    },
    moduleSideEffects: ['sql.js'],
    hooks: {
      async compiled(nitro) {
        if (nitro.options.dev) return
        const { pathToFileURL } = await import('node:url')
        const { join } = await import('node:path')
        const script = pathToFileURL(join(nitro.options.rootDir, 'scripts', 'copy-sql-wasm.mjs')).href
        const { copySqlWasm } = await import(script)
        copySqlWasm({
          serverDir: nitro.options.output.serverDir,
          rootDir: nitro.options.rootDir
        })
      }
    }
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

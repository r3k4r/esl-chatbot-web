import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      script: [
        {
          // Apply the saved theme before first paint so dark-mode users
          // don't get a flash of the light UI. Kept in sync by useTheme().
          innerHTML: "try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
        },
      ],
    },
  },
  runtimeConfig: {
    BASE_URL: process.env.NUXT_PUBLIC_BASE_URL,
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID,
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL ?? 'http://localhost:8000/api/v1',
    },
  },
  devServer: {
    port: 3001,
  },

  vite: {
    plugins: [
      tailwindcss()
    ]
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en', dir: 'ltr', name: 'English', file: 'en.json' },
      { code: 'ku', language: 'ckb', dir: 'rtl', name: 'کوردی', file: 'ku.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    detectBrowserLanguage: false,
    compilation: {
      strictMessage: false,
    },
    vueI18n: 'i18n.config.ts',
    restructureDir: 'i18n',
  },

  shadcn: {
    prefix: 'Ui',
    componentDir: [
      '@/components/ui',
      {
        path: '@/components/ai',
        prefix: 'Ai',
      },
    ],
  },
  modules: ['@pinia/nuxt', '@nuxt/image', 'shadcn-nuxt', 'nuxt-marquee', '@nuxtjs/i18n']
})
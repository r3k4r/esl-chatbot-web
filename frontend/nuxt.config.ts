import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      // Kurdish (Sorani) fonts. Google Fonts splits them by unicode-range, so the files only
      // download when Arabic-script text is on screen; English pages don't pay for them.
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&family=Vazirmatn:wght@100..900&display=swap',
        },
      ],
      script: [
        {
          // Apply the theme before first paint so dark-mode users don't get a flash
          // of the light UI: the learner's saved choice, otherwise the system setting.
          // Dashboard only — public pages are always light. Same rule as composables/useTheme.ts.
          innerHTML: "try{var p=location.pathname,s=localStorage.getItem('theme');if((s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))&&(p==='/dashboard'||p.indexOf('/dashboard/')===0))document.documentElement.classList.add('dark')}catch(e){}",
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
  modules: ['@pinia/nuxt', '@nuxt/image', 'shadcn-nuxt', 'nuxt-marquee', '@nuxtjs/i18n'],

  // `nuxi build --envName e2e` (used by Playwright) builds into its own folders so it
  // never clobbers a running dev server's .nuxt or a production .output.
  $env: {
    e2e: {
      buildDir: '.nuxt-e2e',
      nitro: { output: { dir: '.output-e2e' } },
    },
  },
})
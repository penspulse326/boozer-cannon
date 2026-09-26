import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
        { crossorigin: '', href: 'https://fonts.gstatic.com', rel: 'preconnect' },
        {
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap',
          rel: 'stylesheet',
        },
        {
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
          rel: 'stylesheet',
        },
      ],
      title: 'BarCraft - 調酒酒譜查詢與工藝分享平台',
    },
  },
  compatibilityDate: '2025-07-15',
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  routeRules: {
    '/api/**': {
      proxy: process.env.API_PROXY_TARGET || 'http://localhost:3001/api/**',
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

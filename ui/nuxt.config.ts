// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/algolia'
  ],
  algolia: {
    apiKey: 'ZW2NOeuc0qOE6CmLez2r5d1Gp5lpgH7x',
    applicationId: 'typesense',
    instantSearch: {
      theme: 'satellite'
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})

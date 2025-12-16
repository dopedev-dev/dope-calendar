import { defineNuxtModule, createResolver, addComponent } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'dope-calendar',
    configKey: 'dopeCalendar',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0'
    }
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 1. Automatically inject the CSS file
    nuxt.options.css.push(resolver.resolve('./dist/calendar.css'))

    // 2. Automatically register the component(s)
    // This allows users to use <DopeCalendar /> without importing it manually.
    // Ensure your src/index.ts exports a component named 'DatePicker' or similar.
    addComponent({
      name: 'DopeCalendar', // The tag name to be used in Nuxt
      export: 'default',     // Assuming the default export of your package is the main component
      filePath: resolver.resolve('./dist/dope-calendar.js')
    })
  }
})
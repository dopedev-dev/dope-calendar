import { defineNuxtModule, createResolver, addComponent } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'dope-calendar',
    configKey: 'dopeCalendar',
    compatibility: {
      nuxt: '^3.0.0 || ^4.0.0'
    }
  },
  // FIX: Add ': any' to options and nuxt parameters
  setup(options: any, nuxt: any) {
    const resolver = createResolver(import.meta.url)

    // 1. Automatically inject the CSS file
    nuxt.options.css.push(resolver.resolve('./dist/calendar.css'))

    // 2. Automatically register the component
    addComponent({
      name: 'DopeCalendar', 
      export: 'default',     
      filePath: resolver.resolve('./dist/dope-calendar.js')
    })
  }
})
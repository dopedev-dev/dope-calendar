import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true // Bundles types into a single file
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      // The entry point we created earlier
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DopeCalendar',
      // The name of the output files (dope-calendar.js, dope-calendar.umd.js)
      fileName: 'dope-calendar',
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // Vue should be provided by the parent project, not bundled inside
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        // Ensure CSS is extracted to a specific file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'dope-calendar.css';
          return assetInfo.name as string;
        },
      },
    },
  },
})
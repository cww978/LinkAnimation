import { defineConfig } from 'vite'
import path from 'path'

// Vite Library Build Configuration for LinkAnimation Class
export default defineConfig({
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: path.resolve(__dirname, 'src/utils/LinkAnimation.ts'),
      name: 'LinkAnimation',
      fileName: (format) => `link-animation.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
})

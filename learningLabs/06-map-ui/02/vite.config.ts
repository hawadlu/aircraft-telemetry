import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],

  preview: { proxy: { '/maps': 'http://127.0.0.1:3000' } },

  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },

  server: {
    proxy: {
      '/maps': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  }
})
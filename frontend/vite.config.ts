import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]highcharts[\\/](modules[\\/]|highcharts-more)/.test(id)) return 'charts-modules'
          if (/[\\/]node_modules[\\/](highcharts|highcharts-react-official)[\\/]/.test(id)) return 'charts'
          if (/[\\/]node_modules[\\/](@mui|@emotion)[\\/]/.test(id)) return 'mui'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT),
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT),
  },
})

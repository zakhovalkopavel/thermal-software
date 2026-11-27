import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Comma-separated Host headers Vite may accept behind nginx (see VITE_ALLOWED_HOSTS). */
function allowedHostsFromEnv(): true | string[] {
  const raw = process.env.VITE_ALLOWED_HOSTS?.trim()
  if (!raw || raw === '*') {
    return true
  }
  const hosts = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  return hosts.length > 0 ? hosts : true
}

const allowedHosts = allowedHostsFromEnv()

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
    allowedHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT),
    allowedHosts,
  },
})

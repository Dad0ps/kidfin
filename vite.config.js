import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync } from 'fs'

const buildTime = new Date().toISOString()
const cacheName = 'kidfin-' + buildTime.replace(/[:.]/g, '-')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-file',
      writeBundle() {
        writeFileSync('dist/version.json', JSON.stringify({ buildTime }))

        // Inject build-specific cache name into service worker
        const sw = readFileSync('public/sw.js', 'utf-8')
        writeFileSync('dist/sw.js', sw.replace('__CACHE_NAME__', cacheName))
      },
    },
  ],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify('1.02'),
  },
})

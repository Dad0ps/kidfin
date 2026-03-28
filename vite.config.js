import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-file',
      writeBundle() {
        writeFileSync('dist/version.json', JSON.stringify({ buildTime }))
      },
    },
  ],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})

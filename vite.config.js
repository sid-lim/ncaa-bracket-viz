import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['5174-iksrmr6a8t3p1m6fg84kg-58220894.manus.computer', '.manus.computer']
  },
  build: {
    rollupOptions: {
      input: {
        main: './src/main.jsx',
      },
    },
  },
})

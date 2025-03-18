import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This ensures assets are loaded correctly on GitHub Pages
  server: {
    host: '0.0.0.0',
    allowedHosts: ['5174-iksrmr6a8t3p1m6fg84kg-58220894.manus.computer', '.manus.computer']
  },
  build: {
    rollupOptions: {
      input: {
        main: './src/main.jsx', // Updated path to ensure it works consistently
      },
    },
    outDir: 'dist', // Specify the output directory
  },
})
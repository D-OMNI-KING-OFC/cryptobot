import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PORT = parseInt(process.env.PORT || '5000', 10);
const API_PORT = parseInt(process.env.API_PORT || '3001', 10);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: PORT,
    strictPort: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: PORT,
    strictPort: true,
  }
})

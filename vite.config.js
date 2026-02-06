import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['framer-motion', 'lucide-react'],
          admin: [
            './src/pages/Admin/AdminLayout',
            './src/pages/Admin/AdminDashboard'
          ]
        }
      }
    }
  }
})

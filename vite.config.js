import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'production-site',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600, // raise warning threshold to 600 kB
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          // Heavy PDF / screenshot libs — loaded only when printing invoices
          if (id.includes('jspdf') || id.includes('jspdf.es')) return 'vendor-pdf';
          if (id.includes('html2canvas')) return 'vendor-canvas';

          // Charts — only used in Dashboard / Financials
          if (id.includes('recharts') || id.includes('CartesianChart') || id.includes('d3-')) return 'vendor-charts';

          // Animation — framer-motion
          if (id.includes('framer-motion')) return 'vendor-motion';

          // Supabase client
          if (id.includes('@supabase')) return 'vendor-supabase';

          // All Radix UI primitives → one shared UI chunk
          if (id.includes('@radix-ui')) return 'vendor-radix';

          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';

          // Everything else in node_modules → general vendor chunk
          if (id.includes('node_modules')) return 'vendor-misc';
        }
      }
    }
  }
})


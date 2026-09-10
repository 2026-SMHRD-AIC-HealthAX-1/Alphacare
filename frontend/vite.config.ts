import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server : {
    //백엔드 CORS 연동
    proxy : {
      '/api' : {
        target : "http://localhost:8079/",
        changeOrigin : true,
      }
    },
      //프론트엔드 포트 고정
      port : 4000,
      strictPort : true
  },
  base : "/Feely"
});
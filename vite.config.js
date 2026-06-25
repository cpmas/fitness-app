import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'fitness-app' with your repo name if you named it differently
  base: '/fitness-app/', 
})

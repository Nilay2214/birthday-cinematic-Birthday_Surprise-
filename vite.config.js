import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    watch: {
      ignored: [
        '**/public/assets/WhatsApp Image 2026-01-29 at 3.51.41 PM.jpeg',
        // Ignore the music folder to avoid EBUSY errors from OneDrive-locked files
        '**/public/assets/music/**',
        // Ignore specific OneDrive-locked media files that cause watcher EBUSY
        '**/public/assets/VID20260707203824.mp4',
      ],
    },
  },
})

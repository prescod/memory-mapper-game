import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  plugins: [react()],
  // The Python engine is loaded with a dynamic import inside the worker, which needs a module worker bundle.
  worker: { format: 'es' },
  // Only the worker imports the Python engine, and only dynamically, so the dev server would not find it
  // until the first Python check. Optimizing it then reloads the page and breaks the running worker.
  optimizeDeps: { include: ['@micropython/micropython-webassembly-pyscript'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // FIX: Suppress TypeScript error for `process.cwd()`.
  // `process.cwd()` is standard in Node.js environments like Vite's config execution context.
  // This error suggests a potential issue with TypeScript's Node.js type resolution in this project.
  // @ts-ignore
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Make process.env.API_KEY available to the client code
      // Vite will replace process.env.API_KEY with the actual value during build.
      // The value comes from Vercel's environment variables or your local .env file.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    // Optional: If your components or utils are not directly in the root or a standard /src
    // and you face resolution issues, you might configure `resolve.alias` here.
    // For now, assuming standard resolution works or paths are relative.
  };
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		// Use esbuild for CSS minify to avoid Lightning CSS warnings on @property
		cssMinify: 'esbuild',
	},
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		eslint(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['pwa/icon.svg', 'pwa/icon-192.png', 'pwa/icon-512.png'],
			manifest: {
				name: 'Sankyu Hub Karyawan',
				short_name: 'Hub Karyawan',
				description: 'Portal mobile karyawan untuk melihat informasi dan riwayat data diri.',
				theme_color: '#123B66',
				background_color: '#F7FBFF',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/karyawan/login',
				scope: '/',
				icons: [
					{
						src: '/pwa/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/pwa/icon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
				navigateFallback: 'index.html',
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
						handler: 'NetworkOnly',
						method: 'GET',
					},
				],
			},
		}),
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
			},
		},
	},
	resolve: {
		alias: [
			{
				find: '@',
				replacement: path.resolve(__dirname, 'src'),
			},
			{
				find: '@helpers',
				replacement: path.resolve(__dirname, 'src/utils/helpers'),
			},
			{
				find: '@hooks',
				replacement: path.resolve(__dirname, 'src/utils/hooks'),
			},
			{
				find: '@hocs',
				replacement: path.resolve(__dirname, 'src/utils/hocs'),
			},
		],
	},
});

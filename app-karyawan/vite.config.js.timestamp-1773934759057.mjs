// vite.config.js
import { defineConfig } from "file:///D:/Github/aplikasi-hub-karyawan/app-karyawan/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Github/aplikasi-hub-karyawan/app-karyawan/node_modules/@vitejs/plugin-react/dist/index.mjs";
import eslint from "file:///D:/Github/aplikasi-hub-karyawan/app-karyawan/node_modules/vite-plugin-eslint/dist/index.mjs";
import { VitePWA } from "file:///D:/Github/aplikasi-hub-karyawan/app-karyawan/node_modules/vite-plugin-pwa/dist/index.js";
import * as path from "path";
var __vite_injected_original_dirname = "D:\\Github\\aplikasi-hub-karyawan\\app-karyawan";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    eslint(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa/icon.svg", "pwa/icon-192.png", "pwa/icon-512.png"],
      manifest: {
        name: "Sankyu Hub Karyawan",
        short_name: "Hub Karyawan",
        description: "Portal mobile karyawan untuk melihat informasi dan riwayat data diri.",
        theme_color: "#123B66",
        background_color: "#F7FBFF",
        display: "standalone",
        orientation: "portrait",
        start_url: "/karyawan/login",
        scope: "/",
        icons: [
          {
            src: "/pwa/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
            method: "GET"
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__vite_injected_original_dirname, "src")
      },
      {
        find: "@helpers",
        replacement: path.resolve(__vite_injected_original_dirname, "src/utils/helpers")
      },
      {
        find: "@hooks",
        replacement: path.resolve(__vite_injected_original_dirname, "src/utils/hooks")
      },
      {
        find: "@hocs",
        replacement: path.resolve(__vite_injected_original_dirname, "src/utils/hocs")
      }
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxHaXRodWJcXFxcYXBsaWthc2ktaHViLWthcnlhd2FuXFxcXGFwcC1rYXJ5YXdhblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcR2l0aHViXFxcXGFwbGlrYXNpLWh1Yi1rYXJ5YXdhblxcXFxhcHAta2FyeWF3YW5cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0dpdGh1Yi9hcGxpa2FzaS1odWIta2FyeWF3YW4vYXBwLWthcnlhd2FuL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IGVzbGludCBmcm9tICd2aXRlLXBsdWdpbi1lc2xpbnQnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcblx0cGx1Z2luczogW1xuXHRcdHJlYWN0KCksXG5cdFx0ZXNsaW50KCksXG5cdFx0Vml0ZVBXQSh7XG5cdFx0XHRyZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcblx0XHRcdGluY2x1ZGVBc3NldHM6IFsncHdhL2ljb24uc3ZnJywgJ3B3YS9pY29uLTE5Mi5wbmcnLCAncHdhL2ljb24tNTEyLnBuZyddLFxuXHRcdFx0bWFuaWZlc3Q6IHtcblx0XHRcdFx0bmFtZTogJ1Nhbmt5dSBIdWIgS2FyeWF3YW4nLFxuXHRcdFx0XHRzaG9ydF9uYW1lOiAnSHViIEthcnlhd2FuJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICdQb3J0YWwgbW9iaWxlIGthcnlhd2FuIHVudHVrIG1lbGloYXQgaW5mb3JtYXNpIGRhbiByaXdheWF0IGRhdGEgZGlyaS4nLFxuXHRcdFx0XHR0aGVtZV9jb2xvcjogJyMxMjNCNjYnLFxuXHRcdFx0XHRiYWNrZ3JvdW5kX2NvbG9yOiAnI0Y3RkJGRicsXG5cdFx0XHRcdGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcblx0XHRcdFx0b3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG5cdFx0XHRcdHN0YXJ0X3VybDogJy9rYXJ5YXdhbi9sb2dpbicsXG5cdFx0XHRcdHNjb3BlOiAnLycsXG5cdFx0XHRcdGljb25zOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3JjOiAnL3B3YS9pY29uLTE5Mi5wbmcnLFxuXHRcdFx0XHRcdFx0c2l6ZXM6ICcxOTJ4MTkyJyxcblx0XHRcdFx0XHRcdHR5cGU6ICdpbWFnZS9wbmcnLFxuXHRcdFx0XHRcdFx0cHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzcmM6ICcvcHdhL2ljb24tNTEyLnBuZycsXG5cdFx0XHRcdFx0XHRzaXplczogJzUxMng1MTInLFxuXHRcdFx0XHRcdFx0dHlwZTogJ2ltYWdlL3BuZycsXG5cdFx0XHRcdFx0XHRwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNyYzogJy9wd2EvaWNvbi5zdmcnLFxuXHRcdFx0XHRcdFx0c2l6ZXM6ICdhbnknLFxuXHRcdFx0XHRcdFx0dHlwZTogJ2ltYWdlL3N2Zyt4bWwnLFxuXHRcdFx0XHRcdFx0cHVycG9zZTogJ2FueScsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0sXG5cdFx0XHR3b3JrYm94OiB7XG5cdFx0XHRcdGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmLHdvZmYyfSddLFxuXHRcdFx0XHRuYXZpZ2F0ZUZhbGxiYWNrOiAnaW5kZXguaHRtbCcsXG5cdFx0XHRcdGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcblx0XHRcdFx0cnVudGltZUNhY2hpbmc6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR1cmxQYXR0ZXJuOiAoeyB1cmwgfSkgPT4gdXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9hcGkvJyksXG5cdFx0XHRcdFx0XHRoYW5kbGVyOiAnTmV0d29ya09ubHknLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRdLFxuXHRcdFx0fSxcblx0XHR9KSxcblx0XSxcblx0c2VydmVyOiB7XG5cdFx0cHJveHk6IHtcblx0XHRcdCcvYXBpJzoge1xuXHRcdFx0XHR0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjQwMDAnLFxuXHRcdFx0XHRjaGFuZ2VPcmlnaW46IHRydWUsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdH0sXG5cdHJlc29sdmU6IHtcblx0XHRhbGlhczogW1xuXHRcdFx0e1xuXHRcdFx0XHRmaW5kOiAnQCcsXG5cdFx0XHRcdHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRmaW5kOiAnQGhlbHBlcnMnLFxuXHRcdFx0XHRyZXBsYWNlbWVudDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy91dGlscy9oZWxwZXJzJyksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRmaW5kOiAnQGhvb2tzJyxcblx0XHRcdFx0cmVwbGFjZW1lbnQ6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvdXRpbHMvaG9va3MnKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGZpbmQ6ICdAaG9jcycsXG5cdFx0XHRcdHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzL2hvY3MnKSxcblx0XHRcdH0sXG5cdFx0XSxcblx0fSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VCxTQUFTLG9CQUFvQjtBQUMzVixPQUFPLFdBQVc7QUFDbEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsZUFBZTtBQUN4QixZQUFZLFVBQVU7QUFKdEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLE1BQ1AsY0FBYztBQUFBLE1BQ2QsZUFBZSxDQUFDLGdCQUFnQixvQkFBb0Isa0JBQWtCO0FBQUEsTUFDdEUsVUFBVTtBQUFBLFFBQ1QsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2IsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsT0FBTztBQUFBLFVBQ047QUFBQSxZQUNDLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNWO0FBQUEsVUFDQTtBQUFBLFlBQ0MsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1Y7QUFBQSxVQUNBO0FBQUEsWUFDQyxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDVjtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUixjQUFjLENBQUMsMkNBQTJDO0FBQUEsUUFDMUQsa0JBQWtCO0FBQUEsUUFDbEIsdUJBQXVCO0FBQUEsUUFDdkIsZ0JBQWdCO0FBQUEsVUFDZjtBQUFBLFlBQ0MsWUFBWSxDQUFDLEVBQUUsSUFBSSxNQUFNLElBQUksU0FBUyxXQUFXLE9BQU87QUFBQSxZQUN4RCxTQUFTO0FBQUEsWUFDVCxRQUFRO0FBQUEsVUFDVDtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRCxDQUFDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2Y7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ047QUFBQSxRQUNDLE1BQU07QUFBQSxRQUNOLGFBQWtCLGFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQzNDO0FBQUEsTUFDQTtBQUFBLFFBQ0MsTUFBTTtBQUFBLFFBQ04sYUFBa0IsYUFBUSxrQ0FBVyxtQkFBbUI7QUFBQSxNQUN6RDtBQUFBLE1BQ0E7QUFBQSxRQUNDLE1BQU07QUFBQSxRQUNOLGFBQWtCLGFBQVEsa0NBQVcsaUJBQWlCO0FBQUEsTUFDdkQ7QUFBQSxNQUNBO0FBQUEsUUFDQyxNQUFNO0FBQUEsUUFDTixhQUFrQixhQUFRLGtDQUFXLGdCQUFnQjtBQUFBLE1BQ3REO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

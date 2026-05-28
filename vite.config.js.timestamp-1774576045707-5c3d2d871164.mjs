// vite.config.js
import { defineConfig } from "file:///C:/_IMPACT/tomcat/webapps/impact_vite/node_modules/vite/dist/node/index.js";
import react from "file:///C:/_IMPACT/tomcat/webapps/impact_vite/node_modules/@vitejs/plugin-react/dist/index.js";
import { createHtmlPlugin } from "file:///C:/_IMPACT/tomcat/webapps/impact_vite/node_modules/vite-plugin-html/dist/index.mjs";
import fs from "fs";
import path from "path";
var injectEnvPlugin = () => ({
  name: "inject-env",
  transformIndexHtml: {
    enforce: "pre",
    transform(html, { path: htmlPath }) {
      const envJsPath = path.join(process.cwd(), "public", "env.js");
      const envExists = fs.existsSync(envJsPath);
      const envScript = '<script src="/env.js"></script>';
      if (html.includes("</head>")) {
        return html.replace("</head>", `${envScript}
  </head>`);
      }
      return html;
    }
  }
});
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    injectEnvPlugin()
  ],
  publicDir: "public",
  server: {
    port: 3e3,
    open: true,
    host: true,
    allowedHosts: [".ngrok-free.dev", ".trycloudflare.com", "localhost"]
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "ag-grid": ["ag-grid-react", "ag-grid-community"]
        }
      }
    }
  },
  // Define env prefix for Vite env variables
  envPrefix: "VITE_"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxfSU1QQUNUXFxcXHRvbWNhdFxcXFx3ZWJhcHBzXFxcXGltcGFjdF92aXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxfSU1QQUNUXFxcXHRvbWNhdFxcXFx3ZWJhcHBzXFxcXGltcGFjdF92aXRlXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9fSU1QQUNUL3RvbWNhdC93ZWJhcHBzL2ltcGFjdF92aXRlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSAndml0ZS1wbHVnaW4taHRtbCdcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuLy8gQ3VzdG9tIHBsdWdpbiB0byBpbmplY3QgZW52LmpzIGJlZm9yZSBtYWluIGJ1bmRsZVxyXG5jb25zdCBpbmplY3RFbnZQbHVnaW4gPSAoKSA9PiAoe1xyXG4gIG5hbWU6ICdpbmplY3QtZW52JyxcclxuICB0cmFuc2Zvcm1JbmRleEh0bWw6IHtcclxuICAgIGVuZm9yY2U6ICdwcmUnLFxyXG4gICAgdHJhbnNmb3JtKGh0bWwsIHsgcGF0aDogaHRtbFBhdGggfSkge1xyXG4gICAgICAvLyBDaGVjayBpZiBlbnYuanMgZXhpc3RzIGluIHB1YmxpYyBmb2xkZXJcclxuICAgICAgY29uc3QgZW52SnNQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdwdWJsaWMnLCAnZW52LmpzJylcclxuICAgICAgY29uc3QgZW52RXhpc3RzID0gZnMuZXhpc3RzU3luYyhlbnZKc1BhdGgpXHJcbiAgICAgIFxyXG4gICAgICAvLyBJbmplY3QgZW52LmpzIHNjcmlwdCB0YWcgYmVmb3JlIHRoZSBtYWluIHNjcmlwdFxyXG4gICAgICBjb25zdCBlbnZTY3JpcHQgPSAnPHNjcmlwdCBzcmM9XCIvZW52LmpzXCI+PC9zY3JpcHQ+J1xyXG4gICAgICBcclxuICAgICAgaWYgKGh0bWwuaW5jbHVkZXMoJzwvaGVhZD4nKSkge1xyXG4gICAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoJzwvaGVhZD4nLCBgJHtlbnZTY3JpcHR9XFxuICA8L2hlYWQ+YClcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgcmV0dXJuIGh0bWxcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBpbmplY3RFbnZQbHVnaW4oKVxyXG4gIF0sXHJcbiAgcHVibGljRGlyOiAncHVibGljJyxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIGFsbG93ZWRIb3N0czogWycubmdyb2stZnJlZS5kZXYnLCAnLnRyeWNsb3VkZmxhcmUuY29tJywgJ2xvY2FsaG9zdCddXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgJ2FnLWdyaWQnOiBbJ2FnLWdyaWQtcmVhY3QnLCAnYWctZ3JpZC1jb21tdW5pdHknXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gRGVmaW5lIGVudiBwcmVmaXggZm9yIFZpdGUgZW52IHZhcmlhYmxlc1xyXG4gIGVudlByZWZpeDogJ1ZJVEVfJ1xyXG59KSlcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlMsU0FBUyxvQkFBb0I7QUFDeFUsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sUUFBUTtBQUNmLE9BQU8sVUFBVTtBQUdqQixJQUFNLGtCQUFrQixPQUFPO0FBQUEsRUFDN0IsTUFBTTtBQUFBLEVBQ04sb0JBQW9CO0FBQUEsSUFDbEIsU0FBUztBQUFBLElBQ1QsVUFBVSxNQUFNLEVBQUUsTUFBTSxTQUFTLEdBQUc7QUFFbEMsWUFBTSxZQUFZLEtBQUssS0FBSyxRQUFRLElBQUksR0FBRyxVQUFVLFFBQVE7QUFDN0QsWUFBTSxZQUFZLEdBQUcsV0FBVyxTQUFTO0FBR3pDLFlBQU0sWUFBWTtBQUVsQixVQUFJLEtBQUssU0FBUyxTQUFTLEdBQUc7QUFDNUIsZUFBTyxLQUFLLFFBQVEsV0FBVyxHQUFHLFNBQVM7QUFBQSxVQUFhO0FBQUEsTUFDMUQ7QUFFQSxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sZ0JBQWdCO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFdBQVc7QUFBQSxFQUNYLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWMsQ0FBQyxtQkFBbUIsc0JBQXNCLFdBQVc7QUFBQSxFQUNyRTtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osV0FBVyxDQUFDLGlCQUFpQixtQkFBbUI7QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxXQUFXO0FBQ2IsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K

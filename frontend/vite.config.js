import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  let config = {
    plugins: [react()],
  };

  if (isDev) {
    const keyPath = path.resolve(__dirname, "localhost+1-key.pem");
    const certPath = path.resolve(__dirname, "localhost+1.pem");
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      config.server = {
        host: "localhost",
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      };
    } else {
      config.server = {
        host: "localhost",
      };
    }
  }

  return config;
});
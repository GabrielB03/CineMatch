import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const keyPath = path.resolve(__dirname, "localhost+1-key.pem");
const certPath = path.resolve(__dirname, "localhost+1.pem");

let serverConfig = {};
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  serverConfig = {
    host: "localhost",
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  };
} else {
  serverConfig = {
    host: "localhost",
  };
}

export default defineConfig({
  plugins: [react()],
  server: serverConfig,
});
import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { createApp } from "./app";
import { setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const isDev = process.env.NODE_ENV === "development";
  const app = createApp({ serveClient: !isDev });
  const server = createServer(app);

  if (isDev) {
    await setupVite(app, server);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const isCloud = Boolean(process.env.RENDER || process.env.PORT);
  const port =
    isCloud && process.env.PORT
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort && !process.env.RENDER) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);

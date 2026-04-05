import "dotenv/config";
import { createApp } from "./app/create-app.js";

async function startServer(initialPort) {
  let port = initialPort;
  const app = await createApp();

  const tryListen = (currentPort) => {
    const server = app.listen(currentPort, () => {
      console.log(`Server running on http://localhost:${currentPort}`);
      console.log(`Swagger UI available at http://localhost:${currentPort}/docs`);
      console.log(`Health check at http://localhost:${currentPort}/health`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${currentPort} is busy, trying ${currentPort + 1}...`);
        tryListen(currentPort + 1);
      } else {
        console.error("Server error:", err);
      }
    });

    // Handle shutdown
    const shutdown = async () => {
      server.close(async () => {
        await app.close();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  };

  tryListen(port);
}

const initialPort = Number(process.env.PORT || 3000);
startServer(initialPort);

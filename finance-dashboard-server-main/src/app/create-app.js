import express from "express";
import swaggerUi from "swagger-ui-express";
import { createAppContext } from "./create-app-context.js";
import { handleRequest } from "../routes/index.js";
import { createOpenApiSpec } from "../docs/openapi.js";

export async function createApp(options = {}) {
  const context = await createAppContext(options);
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Swagger JSON
  app.get("/swagger.json", (req, res) => {
    res.json(createOpenApiSpec());
  });

  // Swagger UI
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(createOpenApiSpec()));

  // Existing custom dispatcher for APIs
  app.use((req, res) => {
    handleRequest(req, res, context);
  });

  return {
    context,
    app,
    listen(port, callback) {
      return app.listen(port, callback);
    },
    async close() {
      await context.close();
    }
  };
}

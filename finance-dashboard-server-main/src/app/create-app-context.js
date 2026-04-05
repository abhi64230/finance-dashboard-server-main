import { createAuthController } from "../controllers/auth-controller.js";
import { createDashboardController } from "../controllers/dashboard-controller.js";
import { createRecordsController } from "../controllers/records-controller.js";
import { createUsersController } from "../controllers/users-controller.js";
import { createPostController } from "../controllers/post-controller.js";
import { createAuditController } from "../controllers/audit-controller.js";
import { createDatabasePool } from "../config/database.js";
import { initializeDatabase } from "../database/init.js";
import { createRecordModel } from "../models/record-model.js";
import { createUserModel } from "../models/user-model.js";
import { createPostModel } from "../models/post-model.js";
import { createAuditModel } from "../models/audit-model.js";
import { createDashboardService } from "../services/dashboard-service.js";
import { createRecordService } from "../services/record-service.js";
import { createUserService } from "../services/user-service.js";
import { createPostService } from "../services/post-service.js";
import { createAuditService } from "../services/audit-service.js";

export async function createAppContext(options = {}) {
  const pool = options.pool || createDatabasePool(options.database);
  const ownsPool = !options.pool;

  if (options.initializeDatabase !== false) {
    try {
      await initializeDatabase(pool, {
        seed: options.seedDatabase !== false
      });
    } catch (error) {
      console.error("Failed to initialize database:", error.message);
      console.warn("Server will continue starting, but database endpoints will fail.");
    }
  }

  const models = {
    users: createUserModel(pool),
    records: createRecordModel(pool),
    posts: createPostModel(pool),
    audit: createAuditModel(pool)
  };

  const services = {
    users: createUserService(models.users),
    records: createRecordService(models.records),
    dashboard: createDashboardService(models.records),
    audit: createAuditService(models.audit),
    posts: createPostService(models.posts, null) // Will be updated below to avoid circular dependency if needed
  };
  services.posts = createPostService(models.posts, services.audit);

  const controllers = {
    auth: createAuthController(services),
    users: createUsersController(services),
    records: createRecordsController(services),
    dashboard: createDashboardController(services),
    posts: createPostController(services),
    audit: createAuditController(services)
  };

  return {
    db: pool,
    models,
    services,
    controllers,
    async close() {
      if (ownsPool) {
        await pool.end();
      }
    }
  };
}

import { randomUUID } from "node:crypto";

export function createAuditService(auditModel) {
  return {
    async logAction(auditData) {
      const { userId, action, entityType, entityId, details, ipAddress } = auditData;
      const id = randomUUID();

      return auditModel.log({
        id,
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress
      });
    },

    async getLogs(filters = {}, user) {
      // Authorization check: Only admin can view audit logs
      if (user.role !== "admin") {
        throw new Error("Unauthorized to view audit logs");
      }

      return auditModel.findAll(filters);
    }
  };
}

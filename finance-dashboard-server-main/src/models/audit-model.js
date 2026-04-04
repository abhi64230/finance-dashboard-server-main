export function createAuditModel(pool) {
  return {
    async log(auditEntry) {
      const { id, userId, action, entityType, entityId, details, ipAddress } = auditEntry;
      const result = await pool.query(
        `
          INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, user_id, action, entity_type, entity_id, details, ip_address, created_at;
        `,
        [id, userId, action, entityType, entityId, JSON.stringify(details || {}), ipAddress]
      );

      return result.rows[0];
    },

    async findAll(filters = {}) {
      const { userId, action, entityType, limit = 50, offset = 0 } = filters;
      const values = [];
      let query = `
        SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at, u.name as user_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
      `;

      const conditions = [];
      if (userId) {
        conditions.push(`a.user_id = $${values.length + 1}`);
        values.push(userId);
      }
      if (action) {
        conditions.push(`a.action = $${values.length + 1}`);
        values.push(action);
      }
      if (entityType) {
        conditions.push(`a.entity_type = $${values.length + 1}`);
        values.push(entityType);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += ` ORDER BY a.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);
      return result.rows;
    }
  };
}

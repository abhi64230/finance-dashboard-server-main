export function createAuditController(services) {
  return {
    async getLogs({ query, user }) {
      try {
        const logs = await services.audit.getLogs(query, user);
        return {
          statusCode: 200,
          body: { data: logs }
        };
      } catch (error) {
        return {
          statusCode: 403,
          body: { error: error.message }
        };
      }
    }
  };
}

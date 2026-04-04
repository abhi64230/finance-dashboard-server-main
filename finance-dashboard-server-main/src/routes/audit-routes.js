import { sendError, sendJson } from "../lib/http/send-response.js";

export async function handleAuditRoutes(request, response, context, url, segments, user) {
  const { controllers } = context;

  if (segments[1] !== "audit") {
    return false;
  }

  // GET /api/audit (Admin only)
  if (request.method === "GET" && segments.length === 2) {
    if (user.role !== "admin") {
      sendError(response, 403, "Forbidden: Only admins can view audit logs");
      return true;
    }
    const result = await controllers.audit.getLogs({ query: url.query, user });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  return false;
}

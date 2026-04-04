import { sendJson } from "../lib/http/send-response.js";
import { notFoundError } from "./helpers.js";

export async function handlePostRoutes(request, response, context, url, segments, user, body) {
  const { controllers } = context;

  if (segments[1] !== "posts") {
    return false;
  }

  // GET /api/posts
  if (request.method === "GET" && segments.length === 2) {
    const result = await controllers.posts.getAllPosts({ query: url.query });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  // GET /api/posts/:id
  if (request.method === "GET" && segments.length === 3) {
    const result = await controllers.posts.getPostById({ params: { id: segments[2] } });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  // POST /api/posts (Analyst or Admin only)
  if (request.method === "POST" && segments.length === 2) {
    if (user.role === "viewer") {
      sendJson(response, 403, { error: "Forbidden: Viewers cannot create posts" });
      return true;
    }
    const result = await controllers.posts.createPost({ body, user });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  // PATCH /api/posts/:id
  if (request.method === "PATCH" && segments.length === 3) {
    const result = await controllers.posts.updatePost({ params: { id: segments[2] }, body, user });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  // DELETE /api/posts/:id
  if (request.method === "DELETE" && segments.length === 3) {
    const result = await controllers.posts.deletePost({ params: { id: segments[2] }, user });
    sendJson(response, result.statusCode, result.body);
    return true;
  }

  return false;
}

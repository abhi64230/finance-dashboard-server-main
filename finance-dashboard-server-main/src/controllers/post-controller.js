export function createPostController(services) {
  return {
    async getAllPosts({ query }) {
      return {
        statusCode: 200,
        body: {
          data: await services.posts.getAllPosts(query)
        }
      };
    },

    async getPostById({ params }) {
      const post = await services.posts.getPostById(params.id);
      if (!post) {
        return {
          statusCode: 404,
          body: { error: "Post not found" }
        };
      }
      return {
        statusCode: 200,
        body: { data: post }
      };
    },

    async createPost({ body, user }) {
      const post = await services.posts.createPost(body, user);
      return {
        statusCode: 201,
        body: { data: post }
      };
    },

    async updatePost({ params, body, user }) {
      try {
        const post = await services.posts.updatePost(params.id, body, user);
        return {
          statusCode: 200,
          body: { data: post }
        };
      } catch (error) {
        return {
          statusCode: error.message.includes("Unauthorized") ? 403 : 404,
          body: { error: error.message }
        };
      }
    },

    async deletePost({ params, user }) {
      try {
        await services.posts.deletePost(params.id, user);
        return {
          statusCode: 204,
          body: null
        };
      } catch (error) {
        return {
          statusCode: error.message.includes("Unauthorized") ? 403 : 404,
          body: { error: error.message }
        };
      }
    }
  };
}

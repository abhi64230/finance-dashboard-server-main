import { randomUUID } from "node:crypto";
import { assertValid, validatePostCreate, validatePostUpdate } from "./validation.js";

export function createPostService(postModel, auditService) {
  return {
    async getAllPosts(filters = {}) {
      return postModel.findAll(filters);
    },

    async getPostById(id) {
      return postModel.findById(id);
    },

    async createPost(postData, user) {
      assertValid(validatePostCreate(postData));

      const post = {
        id: randomUUID(),
        title: postData.title,
        content: postData.content,
        category: postData.category,
        authorId: user.id
      };

      const newPost = await postModel.create(post);

      await auditService.logAction({
        userId: user.id,
        action: "CREATE_POST",
        entityType: "POST",
        entityId: newPost.id,
        details: { title: newPost.title }
      });

      return newPost;
    },

    async updatePost(id, updates, user) {
      const existingPost = await postModel.findById(id);
      if (!existingPost) {
        throw new Error("Post not found");
      }

      // Authorization check: Only author or admin can update
      if (existingPost.author_id !== user.id && user.role !== "admin") {
        throw new Error("Unauthorized to update this post");
      }

      assertValid(validatePostUpdate(updates));

      const updatedPost = await postModel.update(id, updates);

      await auditService.logAction({
        userId: user.id,
        action: "UPDATE_POST",
        entityType: "POST",
        entityId: id,
        details: { updates }
      });

      return updatedPost;
    },

    async deletePost(id, user) {
      const existingPost = await postModel.findById(id);
      if (!existingPost) {
        throw new Error("Post not found");
      }

      // Authorization check: Only author or admin can delete
      if (existingPost.author_id !== user.id && user.role !== "admin") {
        throw new Error("Unauthorized to delete this post");
      }

      const deleted = await postModel.delete(id);

      await auditService.logAction({
        userId: user.id,
        action: "DELETE_POST",
        entityType: "POST",
        entityId: id,
        details: { title: existingPost.title }
      });

      return deleted;
    }
  };
}

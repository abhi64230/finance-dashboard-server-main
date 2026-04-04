export function createPostModel(pool) {
  return {
    async findAll(filters = {}) {
      const { category, authorId } = filters;
      const values = [];
      let query = `
        SELECT p.id, p.title, p.content, p.category, p.author_id, p.created_at, p.updated_at, u.name as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
      `;

      const conditions = [];
      if (category) {
        conditions.push(`p.category = $${values.length + 1}`);
        values.push(category);
      }
      if (authorId) {
        conditions.push(`p.author_id = $${values.length + 1}`);
        values.push(authorId);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY p.created_at DESC";

      const result = await pool.query(query, values);
      return result.rows;
    },

    async findById(id) {
      const result = await pool.query(
        `
          SELECT p.id, p.title, p.content, p.category, p.author_id, p.created_at, p.updated_at, u.name as author_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.id = $1;
        `,
        [id]
      );

      return result.rows[0] || null;
    },

    async create(post) {
      const result = await pool.query(
        `
          INSERT INTO posts (id, title, content, category, author_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, title, content, category, author_id, created_at, updated_at;
        `,
        [post.id, post.title, post.content, post.category, post.authorId]
      );

      return result.rows[0];
    },

    async update(id, updates) {
      const fields = [];
      const values = [];

      if ("title" in updates) {
        fields.push(`title = $${fields.length + 1}`);
        values.push(updates.title);
      }
      if ("content" in updates) {
        fields.push(`content = $${fields.length + 1}`);
        values.push(updates.content);
      }
      if ("category" in updates) {
        fields.push(`category = $${fields.length + 1}`);
        values.push(updates.category);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const result = await pool.query(
        `
          UPDATE posts
          SET ${fields.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
          RETURNING id, title, content, category, author_id, created_at, updated_at;
        `,
        values
      );

      return result.rows[0] || null;
    },

    async delete(id) {
      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 RETURNING id;",
        [id]
      );
      return result.rowCount > 0;
    }
  };
}

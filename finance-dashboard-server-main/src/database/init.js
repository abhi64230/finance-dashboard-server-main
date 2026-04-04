import { scryptSync, randomBytes } from "node:crypto";
import { seedRecords, seedUsers } from "./seed-data.js";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function createSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255),
      role VARCHAR(20) NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      token VARCHAR(160) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id TEXT PRIMARY KEY,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
      category VARCHAR(120) NOT NULL,
      date DATE NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_date
    ON financial_records (date DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_type
    ON financial_records (type);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_financial_records_category
    ON financial_records (category);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('Market Update', 'Internal Announcement', 'Financial Insight')),
      author_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id TEXT,
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(45),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_posts_author
    ON posts (author_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs (user_id);
  `);
}

async function seedUsersTable(pool) {
  for (const user of seedUsers) {
    await pool.query(
      `
        INSERT INTO users (id, name, email, password_hash, role, status, token)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `,
      [
        user.id,
        user.name,
        user.email,
        hashPassword(user.password),
        user.role,
        user.status,
        user.token
      ]
    );
  }
}

async function backfillSeedUserPasswords(pool) {
  for (const user of seedUsers) {
    await pool.query(
      `
        UPDATE users
        SET password_hash = COALESCE(password_hash, $2)
        WHERE email = $1;
      `,
      [user.email, hashPassword(user.password)]
    );
  }
}

async function seedRecordsTable(pool) {
  for (const record of seedRecords) {
    await pool.query(
      `
        INSERT INTO financial_records (id, amount, type, category, date, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING;
      `,
      [
        record.id,
        record.amount,
        record.type,
        record.category,
        record.date,
        record.notes,
        record.createdBy
      ]
    );
  }
}

async function seedPostsTable(pool) {
  const result = await pool.query("SELECT id FROM users WHERE role IN ('admin', 'analyst') LIMIT 2;");
  const authors = result.rows;

  if (authors.length === 0) return;

  const posts = [
    {
      id: "p1",
      title: "Quarterly Market Outlook",
      content: "The market is showing strong signs of recovery in the tech sector. Analysts suggest a diversified approach with a focus on sustainable energy and AI developments.",
      category: "Market Update",
      authorId: authors[0].id
    },
    {
      id: "p2",
      title: "New Policy: Travel Expenses",
      content: "Please note the updated guidelines for travel reimbursement starting next month. All receipts must be digital and submitted within 5 business days.",
      category: "Internal Announcement",
      authorId: authors[authors.length > 1 ? 1 : 0].id
    }
  ];

  for (const post of posts) {
    await pool.query(
      `
        INSERT INTO posts (id, title, content, category, author_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING;
      `,
      [post.id, post.title, post.content, post.category, post.authorId]
    );
  }
}

export async function initializeDatabase(pool, options = {}) {
  await createSchema(pool);
  await backfillSeedUserPasswords(pool);

  if (options.seed === false) {
    return;
  }

  const result = await pool.query("SELECT COUNT(*)::int AS count FROM users;");

  if (result.rows[0].count > 0) {
    return;
  }

  await seedUsersTable(pool);
  await seedRecordsTable(pool);
  await seedPostsTable(pool);
}

# Finance Dashboard Backend - Pro Edition

An enhanced backend system for a finance dashboard, built with **Node.js (native `http` module)** and **PostgreSQL**. This project demonstrates a clean, framework-less architecture (no Express) with a strong focus on role-based access control (RBAC), data integrity, and enterprise-grade features like audit logging.

## Key Enhancements

- **Framework-less Architecture**: Uses native Node.js `http` module for maximum performance and educational clarity.
- **Enhanced Analytics**: Advanced SQL-based insights including Month-over-Month (MoM) growth benchmarks and top spending category detection.
- **Internal Knowledge Base (Posts)**: A dedicated system for Analysts and Admins to share market updates and financial insights.
- **Comprehensive Audit Trail**: Every sensitive action (creation, updates, deletions) is captured in an immutable audit log.
- **Robust RBAC**: Detailed permission matrix for Viewers, Analysts, and Admins.

## Stack

- **Runtime**: Node.js (ESM)
- **Database**: PostgreSQL (via `pg`)
- **Architecture**: MVC-style (Models, Services, Controllers, Routes)
- **Testing**: Built-in `node:test` runner
- **Documentation**: OpenAPI (Swagger) integration

## Project Structure

- `src/app`: Application factory and context management
- `src/controllers`: Request handling logic
- `src/services`: Business logic, validation, and orchestration
- `src/models`: Direct database interactions (PostgreSQL queries)
- `src/routes`: Manual HTTP routing and dispatching
- `src/database`: Schema definitions and seeding logic
- `src/lib`: Shared HTTP utilities and error handlers

## Role-Based Access Control (RBAC)

| Feature | Viewer | Analyst | Admin |
| :--- | :---: | :---: | :---: |
| View Dashboard | ✅ | ✅ | ✅ |
| View Records | ❌ | ✅ | ✅ |
| Create/Edit Records | ❌ | ❌ | ✅ |
| View Posts | ✅ | ✅ | ✅ |
| Create/Edit Posts | ❌ | ✅ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |

## Getting Started

### 1. Database Configuration

Create a PostgreSQL database and configure your environment:

```bash
# Example .env
DATABASE_URL=postgresql://user:pass@localhost:5432/finance_db
PORT=3000
```

### 2. Installation & Run

```bash
npm install
npm run dev
```

The system will automatically initialize the schema and seed demo data if the database is empty.

### 3. Seeded Access Tokens

Include these in the `Authorization` header:
- `admin-token`
- `analyst-token`
- `viewer-token`

## API Reference

### Dashboard & Analytics
- `GET /api/dashboard/summary`: Comprehensive financial summary + growth metrics.
- `GET /api/dashboard/trends`: Historical data with weekly/monthly granularity.
- `GET /api/dashboard/recent-activity`: Latest global transactions.

### Posts (Insights & Announcements)
- `GET /api/posts`: List all insights (Filter by `category` or `author_id`).
- `POST /api/posts`: Create a new insight (Analyst/Admin).
- `PATCH /api/posts/:id`: Update existing post (Author/Admin).
- `DELETE /api/posts/:id`: Remove a post (Author/Admin).

### Financial Records
- `GET /api/records`: Paged list with filtering (`type`, `category`, `startDate`, `endDate`).
- `POST /api/records`: Log a new transaction (Admin).
- `PATCH /api/records/:id`: Update transaction details (Admin).
- `DELETE /api/records/:id`: Soft-delete a record (Admin).

### Audit Logs (Admin Only)
- `GET /api/audit`: Retrieve the system-wide audit trail.

## Validation & Error Handling

All inputs are strictly validated. Failed validations return a `422 Unprocessable Entity` with a structured error body:

```json
{
  "error": {
    "message": "Validation failed.",
    "details": [
      { "field": "amount", "message": "Amount must be a positive number." }
    ]
  }
}
```

## Testing

Run the integration suite (requires `TEST_DATABASE_URL`):

```bash
npm test
```

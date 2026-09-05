# Taskly

Taskly is a focused, collaborative Kanban board built with Next.js. Its API uses MongoDB document storage for tasks, users, and comments.

## Storage model

- `tasks` stores each task as a document, including status, priority, position, due date, and timestamps.
- `users` stores the workspace users used for task-comment attribution.
- `comments` stores task and author `ObjectId` references. Deleting a task also deletes its comments through the API.
- MongoDB indexes support task-board ordering (`status`, `position`), user ordering (`createdAt`), and task-comment retrieval (`taskId`, `createdAt`).

On the first request to `/api/users`, Taskly creates the default Jordan Davis, Alex Chen, and Sam Ibarra users when the collection is empty.

## Setup

1. Start MongoDB locally or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` if needed.
3. Set a connection string and database name:

   ```env
   MONGODB_URI="mongodb://127.0.0.1:27017"
   MONGODB_DB="taskly"
   ```

   For Atlas, use its connection string for `MONGODB_URI`. Keep credentials out of source control.

4. Install dependencies and run the app:

   ```bash
   pnpm install
   pnpm dev
   ```

This is a fresh MongoDB datastore migration: it intentionally does not import the prior local SQLite data.

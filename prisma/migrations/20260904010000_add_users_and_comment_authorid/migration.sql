-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SeedUsers
INSERT INTO "User" ("id", "name", "initials", "color", "createdAt") VALUES
    ('user_jordan_davis', 'Jordan Davis', 'JD', '#46588f', CURRENT_TIMESTAMP),
    ('user_alex_chen',    'Alex Chen',    'AC', '#48a88a', CURRENT_TIMESTAMP),
    ('user_sam_ibarra',   'Sam Ibarra',   'SI', '#b37b26', CURRENT_TIMESTAMP);

-- RedefineTables: SQLite can't ALTER a column into a FK, so rebuild Comment
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Backfill: the one pre-existing comment used the old default author 'JD' -> map it to the seeded Jordan Davis user
INSERT INTO "new_Comment" ("id", "body", "authorId", "createdAt", "taskId")
    SELECT "id", "body", 'user_jordan_davis', "createdAt", "taskId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_taskId_createdAt_idx" ON "Comment"("taskId", "createdAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

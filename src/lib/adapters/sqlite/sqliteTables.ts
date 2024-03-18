export const sqliteTables = `
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Table: accounts
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "avatar_url" TEXT,
    "details" TEXT DEFAULT '{}'
);

-- Table: credits
CREATE TABLE IF NOT EXISTS "credits" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT,
    "receiver_id" TEXT,
    "amount" NUMERIC,
    "reason" TEXT
);

-- Table: descriptions
CREATE TABLE IF NOT EXISTS "descriptions" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "embedding" BLOB NOT NULL,
    "user_id" TEXT,
    "user_ids" TEXT,
    "room_id" TEXT,
    "name" TEXT,
    "unique" INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
);

-- Table: facts
CREATE TABLE IF NOT EXISTS "facts" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "embedding" BLOB NOT NULL,
    "user_id" TEXT,
    "user_ids" TEXT,
    "room_id" TEXT,
    "unique" INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
);

-- Table: goals
CREATE TABLE IF NOT EXISTS "goals" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "user_ids" TEXT DEFAULT '[]' NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "status" TEXT,
    "description" TEXT,
    "objectives" TEXT DEFAULT '[]' NOT NULL
);

-- Table: logs
CREATE TABLE IF NOT EXISTS "logs" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_ids" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL
);

-- Table: lore
CREATE TABLE IF NOT EXISTS "lore" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "embedding" BLOB NOT NULL,
    "user_id" TEXT,
    "user_ids" TEXT,
    "room_id" TEXT,
    "name" TEXT,
    "unique" INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
);

-- Table: messages
CREATE TABLE IF NOT EXISTS "messages" (
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "content" TEXT,
    "is_edited" INTEGER DEFAULT 0,
    "room_id" TEXT,
    "updated_at" TIMESTAMP,
    "user_ids" TEXT DEFAULT '[]' NOT NULL,
    "id" TEXT PRIMARY KEY,
    "embedding" BLOB,
    "unique" INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
);

-- Table: participants
CREATE TABLE IF NOT EXISTS "participants" (
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "room_id" TEXT,
    "id" TEXT PRIMARY KEY,
    "last_message_read" TEXT,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id")
);

-- Table: relationships
CREATE TABLE IF NOT EXISTS "relationships" (
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "user_a" TEXT,
    "user_b" TEXT,
    "status" TEXT,
    "id" TEXT PRIMARY KEY,
    "room_id" TEXT,
    "user_id" TEXT NOT NULL,
    FOREIGN KEY ("user_a") REFERENCES "accounts"("id"),
    FOREIGN KEY ("user_b") REFERENCES "accounts"("id"),
    FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "accounts"("id")
);

-- Table: rooms
CREATE TABLE IF NOT EXISTS "rooms" (
    "id" TEXT PRIMARY KEY,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "name" TEXT,
    FOREIGN KEY ("created_by") REFERENCES "accounts"("id")
);

-- Index: relationships_id_key
CREATE UNIQUE INDEX IF NOT EXISTS "relationships_id_key" ON "relationships" ("id");

-- Index: messages_id_key
CREATE UNIQUE INDEX IF NOT EXISTS "messages_id_key" ON "messages" ("id");

-- Index: participants_id_key
CREATE UNIQUE INDEX IF NOT EXISTS "participants_id_key" ON "participants" ("id");

COMMIT;`;

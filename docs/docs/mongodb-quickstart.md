# MongoDB Quickstart

This guide shows you how to run bgent locally with the MongoDB database adapter — no Docker, no Supabase account, no SQL dumps.

## Install

Add the adapter and the MongoDB driver to your project:

```bash
npm install bgent mongodb
```

## Run a local MongoDB (optional)

If you don't have a MongoDB instance handy, the quickest way to get one for local development is `mongodb-memory-server` — it downloads and launches a real `mongod` binary in-process, with no system install:

```bash
npm install -D mongodb-memory-server
```

```typescript
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri(); // e.g. mongodb://127.0.0.1:39927/?directConnection=true
```

Otherwise, point the adapter at any standard `mongodb://` connection string (local `mongod`, Docker, or Atlas).

## Wire up the runtime

```typescript
import { BgentRuntime, MongoDatabaseAdapter } from "bgent";

// In-memory MongoDB (see above) — or your own URI:
// const adapter = new MongoDatabaseAdapter("mongodb://localhost:27017", "bgent");
const adapter = new MongoDatabaseAdapter(uri, "bgent");
await adapter.connect();

const runtime = new BgentRuntime({
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY, // API key or JWT for your AI service
  databaseAdapter: adapter,
  model: "gpt-3.5-turbo",            // whatever model you want
  embeddingModel: "text-embedding-3-small",
  // actions: [...], evaluators: [...], providers: [...]
});
```

The adapter uses one collection per entity type: `rooms`, `accounts`, `participants`, `memories`, `goals`, `logs`, `relationships`. Collections are created lazily on first write, so there is no schema setup step.

## Handling messages

Rooms and accounts are created with the adapter directly, then messages flow through `handleMessage` as usual:

```typescript
await runtime.databaseAdapter.createRoom("room-uuid");
await runtime.databaseAdapter.createAccount({
  id: "user-uuid",
  name: "Alice",
  details: { source: "quickstart" },
});

const response = await runtime.handleMessage({
  user_id: "user-uuid",
  content: { content: "Hello!" },
  room_id: "room-uuid",
});
console.log("Agent response:", response);
```

## Unique memories & deduplication

`createMemory(memory, tableName, unique = true)` stores a `unique` flag and skips insertion when a near-identical memory already exists in the same room:

```typescript
await runtime.databaseAdapter.createMemory(memory, "facts", true);
```

## Vector search

Embeddings are stored as plain arrays on memory documents. By default the adapter searches with an in-process cosine-similarity scan over the stored arrays (exact, no index required):

```typescript
const memories = await runtime.databaseAdapter.searchMemoriesByEmbedding(embedding, {
  tableName: "facts",
  room_id: "room-uuid",
  match_threshold: 0.8,
  count: 5,
});
```

For large collections, create an Atlas Vector Search index on the `memories.embedding` field (`type: "vector", 1536 dimensions, similarity: "cosine"`) and query it with `$vectorSearch` instead — the stored data shape is identical, so the two modes are drop-in interchangeable.

## Teardown

```typescript
await adapter.disconnect();
```

## Running the integration test

The repo ships a full integration test at `mongotest.mjs` which exercises rooms, accounts, participants, memories (including unique dedup), vector search, goals, logs and relationships against a real in-memory MongoDB:

```bash
npm i -D mongodb-memory-server
npx tsx mongotest.mjs
# ✓ ... ALL PASSED
```

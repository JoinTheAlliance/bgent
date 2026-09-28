---
title: MongoDB and vector search
sidebar_position: 3
---

# MongoDB and vector search

`MongoDBDatabaseAdapter` implements the database contract for Node.js applications, including accounts, rooms, participants, relationships, goals, logs, memory CRUD, embedding caching, and native MongoDB Vector Search. The caller owns the `MongoClient` connection. Call `adapter.init()` before using it and close the client during application shutdown.

The adapter requires a MongoDB deployment with Vector Search and replica-set transactions: Atlas, or the official local development image below. A plain MongoDB container without `mongot` does not provide vector search. The Node.js driver is not a Cloudflare Workers adapter.

## Start a local deployment

Install Docker, then start the official image pinned to the tested MongoDB 8.0.17 digest:

```sh
docker run --detach --rm --name bgent-mongodb-local \
  --publish 127.0.0.1:27160:27017 \
  mongodb/mongodb-atlas-local@sha256:3187e2adea4e9570658d05c93013de9de301fcc4b530796df08742e7168dd9cb

docker inspect --format '{{.State.Health.Status}}' bgent-mongodb-local
```

Wait for the health status to become `healthy`. This test deployment binds to localhost and contains no production data. It uses no host mounts or external account. Stop it with `docker stop bgent-mongodb-local`; `--rm` removes the container and its anonymous data volumes.

MongoDB describes this image as a [local development and testing deployment](https://www.mongodb.com/docs/search/self-managed/current/installation/quick-start/). Use a properly authenticated, maintained deployment for production. The test image is pinned for reproducibility, not as a recommendation to freeze production updates.

## Connect the adapter

```typescript
import { MongoClient } from "mongodb";
import { BgentRuntime, MongoDBDatabaseAdapter } from "bgent";

const client = new MongoClient(
  "mongodb://127.0.0.1:27160/?directConnection=true",
);
await client.connect();
const adapter = new MongoDBDatabaseAdapter(client.db("bgent"));
await adapter.init();

const runtime = new BgentRuntime({
  databaseAdapter: adapter,
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY ?? "",
});

// Use runtime.messageManager and the other existing managers as usual.
// Model calls require the chosen provider's token. Database operations do not.
// During shutdown:
await client.close();
```

Initialization creates ordinary indexes and a named vector index on the `memories` collection, then waits up to 60 seconds for it to become queryable. Repeated initialization preserves existing data. An existing index with incompatible dimensions or filters causes a clear error; the adapter does not silently replace it.

Options:

| Option | Default | Purpose |
| --- | --- | --- |
| `dimensions` | `1536` | Number of finite numbers in every stored/query embedding; must match the model. |
| `vectorIndexName` | `bgent_memory_vector` | Name of the MongoDB Vector Search index. |
| `indexTimeoutMs` | `60000` | Maximum wait for initial index readiness. |

For precomputed three-dimensional test vectors, construct the adapter with `{ dimensions: 3 }`. Changing the dimension of an existing collection requires a new compatible index and compatible stored vectors.

## Query and consistency behavior

Memory types such as `messages`, `facts`, and `lore` share the `memories` collection and are separated by `type`. Room, type, and unique-only restrictions are applied inside `$vectorSearch` before selecting nearest neighbors. Search scores are converted from MongoDB's normalized score to cosine similarity in `[-1, 1]`, preserving the existing adapter threshold semantics. Matches must be strictly above `match_threshold`. Vector queries accept counts from 0 through 10,000; larger counts fail explicitly. The candidate pool is capped at MongoDB’s 10,000-candidate limit.

Vector indexes update asynchronously. A successful insert is immediately visible through ordinary memory retrieval but can take a short time to appear in vector queries. The integration tests poll for this indexed visibility. No model API is called by the adapter.

Calling `createMemory(memory, type, true)` marks a memory non-unique when an existing memory from the same user, room, and type has cosine similarity above `0.95`. It still stores the memory; unique-only queries exclude it. This check scans the scoped stored vectors so it sees sequential inserts even before the search index catches up. It is a best-effort semantic flag, not a cross-process uniqueness lock; concurrent similar writes can both be marked unique. With the default `false` argument, memories are stored as unique without that check. UUIDs are always protected by a unique index.

Embedding-cache lookup uses edit distance over the requested nested field, sorted by distance and limited by the requested count. Like the existing SQL function, input longer than 255 characters uses exact matches only. Cache lookup and optional semantic uniqueness checking scan their respective scopes; indexed vector retrieval remains the search path.

Account creation is an upsert. Adding a participant is idempotent and requires an existing account and room. Relationships are symmetric and idempotent, using a shared room or creating one. Removing a room uses a transaction to remove its memories, goals, memberships, relationships, and logs together. Other rooms and accounts remain intact.

## Run real integration tests

From a repository checkout, with the local container healthy:

```sh
npm ci --ignore-scripts
npm run test:mongodb
```

The dedicated test command defaults to the localhost URI above. Set `MONGODB_TEST_URI` to override it. Tests create a uniquely named temporary database, create the actual vector index, exercise the adapter and runtime managers using precomputed vectors, then drop only that test database and close its connection. The rest of the project's tests use their existing database/model configuration; ordinary `npm test` skips this integration file when `MONGODB_TEST_URI` is absent.

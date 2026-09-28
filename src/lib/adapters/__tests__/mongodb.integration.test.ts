import { randomUUID } from "node:crypto";
import { MongoClient, type Db } from "mongodb";
import { MongoDBDatabaseAdapter } from "../mongodb";
import { BgentRuntime } from "../../runtime";
import { GoalStatus, type Goal, type Memory, type UUID } from "../../types";

const describeMongo = process.env.MONGODB_TEST_URI ? describe : describe.skip;

describeMongo("MongoDB adapter against a real vector-search deployment", () => {
  let client: MongoClient;
  let db: Db;
  let adapter: MongoDBDatabaseAdapter;
  let user: UUID;
  let otherUser: UUID;
  let room: UUID;
  let otherRoom: UUID;

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_TEST_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db("bgent_test_" + randomUUID().replaceAll("-", ""));
    adapter = new MongoDBDatabaseAdapter(db, {
      dimensions: 3,
      indexTimeoutMs: 90000,
    });
    await adapter.init();
  }, 120000);

  beforeEach(async () => {
    user = randomUUID();
    otherUser = randomUUID();
    room = await adapter.createRoom();
    otherRoom = await adapter.createRoom();
    await adapter.createAccount({
      id: user,
      name: "Alice",
      details: { tagline: "Local tester", summary: "Testing", quote: "Hello" },
    });
    await adapter.createAccount({ id: otherUser, name: "Bob" });
  });

  afterAll(async () => {
    if (db) await db.dropDatabase();
    if (client) await client.close();
  });

  const memory = (overrides: Partial<Memory> = {}): Memory => ({
    id: randomUUID(),
    user_id: user,
    room_id: room,
    content: { content: "hello", source: "test" },
    embedding: [1, 0, 0],
    ...overrides,
  });

  const goal = (overrides: Partial<Goal> = {}): Goal => ({
    id: randomUUID(),
    room_id: room,
    user_id: user,
    name: "Test goal",
    status: GoalStatus.IN_PROGRESS,
    objectives: [{ description: "First", completed: false }],
    ...overrides,
  });

  test("initialization is idempotent and rejects incompatible vector dimensions", async () => {
    await adapter.init();
    const incompatible = new MongoDBDatabaseAdapter(db, { dimensions: 4 });
    await expect(incompatible.init()).rejects.toThrow(
      "incompatible definition",
    );
  });

  test("accounts retain nested data and upsert without duplicate IDs", async () => {
    expect(await adapter.getAccountById(randomUUID())).toBeNull();
    await adapter.createAccount({
      id: user,
      name: "Updated",
      details: { nested: [1, 2] },
    });
    expect(await adapter.getAccountById(user)).toEqual({
      id: user,
      name: "Updated",
      details: { nested: [1, 2] },
    });
    expect(await db.collection("accounts").countDocuments({ id: user })).toBe(
      1,
    );
  });

  test("independent adapters initialize the same new database concurrently", async () => {
    const fresh = client.db("bgent_test_" + randomUUID().replaceAll("-", ""));
    try {
      const adapters = [1, 2, 3, 4, 5].map(
        () =>
          new MongoDBDatabaseAdapter(fresh, {
            dimensions: 3,
            indexTimeoutMs: 90000,
          }),
      );
      const results = await Promise.allSettled(
        adapters.map((instance) => instance.init()),
      );
      const failed = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failed) throw failed.reason;
      expect(
        await fresh.collection("memories").listSearchIndexes().toArray(),
      ).toHaveLength(1);
    } finally {
      await fresh.dropDatabase();
    }
  }, 120000);

  test("room and participant operations are idempotent and join account details", async () => {
    expect(await adapter.getRoom(randomUUID())).toBeNull();
    expect(await adapter.createRoom(room)).toBe(room);
    expect(await adapter.addParticipant(randomUUID(), room)).toBe(false);
    expect(await adapter.addParticipant(user, randomUUID())).toBe(false);
    await Promise.all(
      Array.from({ length: 5 }, () => adapter.addParticipant(user, room)),
    );
    await adapter.addParticipant(otherUser, room);
    await adapter.addParticipant(user, otherRoom);
    expect(await adapter.getParticipantsForRoom(room)).toEqual(
      expect.arrayContaining([user, otherUser]),
    );
    expect(await adapter.getRoomsForParticipant(user)).toHaveLength(2);
    expect(
      await adapter.getRoomsForParticipants([user, otherUser]),
    ).toHaveLength(2);
    expect(await adapter.getRoomsForParticipants([])).toEqual([]);
    const memberships = await adapter.getParticipantsForAccount(user);
    expect(memberships).toHaveLength(2);
    expect(memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          room_id: room,
          account: expect.objectContaining({ name: "Alice" }),
        }),
        expect.objectContaining({ room_id: otherRoom }),
      ]),
    );
    expect(await adapter.getActorDetails({ room_id: room })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: user,
          details: {
            tagline: "Local tester",
            summary: "Testing",
            quote: "Hello",
          },
        }),
        expect.objectContaining({
          id: otherUser,
          details: { tagline: "", summary: "", quote: "" },
        }),
      ]),
    );
    await adapter.removeParticipant(user, room);
    expect(await adapter.getParticipantsForRoom(room)).toEqual([otherUser]);
  });

  test("memories round-trip structured content, IDs and timestamps with room/type isolation", async () => {
    const first = memory({
      created_at: "2024-01-01T00:00:00.000Z",
      content: { content: "first", extra: { tags: ["a"] } },
    });
    const second = memory({ created_at: "2024-01-02T00:00:00.000Z" });
    await adapter.createMemory(first, "messages");
    await adapter.createMemory(second, "messages");
    await adapter.createMemory(memory({ room_id: otherRoom }), "messages");
    await adapter.createMemory(memory(), "facts");
    expect(
      await adapter.getMemories({
        room_id: room,
        tableName: "messages",
        count: 1,
      }),
    ).toEqual([expect.objectContaining(second)]);
    expect(await adapter.countMemories(room, false, "messages")).toBe(2);
    await expect(adapter.createMemory(first, "messages")).rejects.toMatchObject(
      { code: 11000 },
    );
    await adapter.removeMemory(first.id!, "facts");
    expect(await adapter.countMemories(room, false, "messages")).toBe(2);
    await adapter.removeMemory(first.id!, "messages");
    expect(await adapter.countMemories(room, false, "messages")).toBe(1);
    await adapter.removeAllMemories(room, "messages");
    expect(await adapter.countMemories(room, false, "messages")).toBe(0);
    expect(await adapter.countMemories(otherRoom, false, "messages")).toBe(1);
    expect(await adapter.countMemories(room, false, "facts")).toBe(1);
  });

  test("uniqueness is scoped and sees immediately preceding inserts before indexing", async () => {
    await adapter.createMemory(memory(), "messages", true);
    await adapter.createMemory(memory(), "messages", true);
    await adapter.createMemory(
      memory({ user_id: otherUser }),
      "messages",
      true,
    );
    await adapter.createMemory(
      memory({ embedding: undefined }),
      "messages",
      true,
    );
    expect(await adapter.countMemories(room, false, "messages")).toBe(4);
    expect(await adapter.countMemories(room, true, "messages")).toBe(3);
    expect(
      await adapter.getMemories({
        room_id: room,
        tableName: "messages",
        unique: true,
      }),
    ).toHaveLength(3);
  });

  test("real vector search ranks aligned, orthogonal and opposite vectors with cosine thresholds", async () => {
    const aligned = memory();
    const orthogonal = memory({ embedding: [0, 1, 0] });
    const opposite = memory({ embedding: [-1, 0, 0] });
    for (const value of [aligned, orthogonal, opposite]) {
      await adapter.createMemory(value, "messages");
    }
    await eventually(async () => {
      const results = await adapter.searchMemoriesByEmbedding([1, 0, 0], {
        tableName: "messages",
        room_id: room,
        count: 3,
        match_threshold: -1,
      });
      expect(results.map((value) => value.id)).toEqual([
        aligned.id,
        orthogonal.id,
      ]);
      expect(
        (results[0] as Memory & { similarity: number }).similarity,
      ).toBeCloseTo(1);
      expect(
        (results[1] as Memory & { similarity: number }).similarity,
      ).toBeCloseTo(0);
    });
    const results = await adapter.searchMemories({
      tableName: "messages",
      room_id: room,
      embedding: [1, 0, 0],
      match_threshold: 0.1,
      match_count: 3,
      unique: false,
    });
    expect(results.map((value) => value.id)).toEqual([aligned.id]);
  }, 40000);

  test("vector filters run before top-k selection, including unique-only searches", async () => {
    const desired = memory({ embedding: [0.8, 0.6, 0] });
    await adapter.createMemory(memory({ room_id: otherRoom }), "messages");
    await adapter.createMemory(memory(), "facts");
    const nonUnique = memory();
    await adapter.createMemory(nonUnique, "messages", true);
    await adapter.createMemory(desired, "messages", true);
    await adapter.createMemory(memory(), "messages", true);
    await adapter.removeMemory(nonUnique.id!, "messages");
    await eventually(async () => {
      const results = await adapter.searchMemoriesByEmbedding([1, 0, 0], {
        tableName: "messages",
        room_id: room,
        unique: true,
        count: 1,
        match_threshold: 0.7,
      });
      expect(results.map((value) => value.id)).toEqual([desired.id]);
    });
  }, 40000);

  test("invalid vectors and counts fail clearly and zero limits never return all records", async () => {
    for (const embedding of [
      [1, 0],
      [1, NaN, 0],
      [Infinity, 0, 0],
      new Array(3),
    ]) {
      await expect(
        adapter.createMemory(memory({ embedding }), "messages"),
      ).rejects.toThrow("finite numbers");
    }
    await expect(
      adapter.searchMemoriesByEmbedding([0, 0, 0], { tableName: "messages" }),
    ).rejects.toThrow("nonzero");
    await expect(
      adapter.searchMemoriesByEmbedding([1, 0, 0], {
        tableName: "messages",
        match_threshold: 2,
      }),
    ).rejects.toThrow("match_threshold");
    await expect(
      adapter.getMemories({ room_id: room, tableName: "messages", count: -1 }),
    ).rejects.toThrow("nonnegative");
    await adapter.createMemory(memory(), "messages");
    expect(
      await adapter.getMemories({
        room_id: room,
        tableName: "messages",
        count: 0,
      }),
    ).toEqual([]);
    expect(
      await adapter.searchMemoriesByEmbedding([1, 0, 0], {
        tableName: "messages",
        count: 0,
      }),
    ).toEqual([]);
    expect(await adapter.getGoals({ room_id: room, count: 0 })).toEqual([]);
    await expect(adapter.countMemories(room)).rejects.toThrow("tableName");
  });

  test("embedding cache uses edit distance, scope, nested fields and limits", async () => {
    await adapter.createMemory(
      memory({ content: { content: "hello" }, embedding: [1, 0, 0] }),
      "cache_" + room,
    );
    await adapter.createMemory(
      memory({ content: { content: "hallo" }, embedding: [0, 1, 0] }),
      "cache_" + room,
    );
    await adapter.createMemory(
      memory({ content: { content: "distant" } }),
      "cache_" + room,
    );
    await adapter.createMemory(
      memory({ content: { content: "hello" } }),
      "other_" + room,
    );
    const params = {
      query_table_name: "cache_" + room,
      query_threshold: 1,
      query_input: "hello",
      query_field_name: "content",
      query_field_sub_name: "content",
      query_match_count: 2,
    };
    expect(await adapter.getCachedEmbeddings(params)).toEqual([
      { embedding: [1, 0, 0], levenshtein_score: 0 },
      { embedding: [0, 1, 0], levenshtein_score: 1 },
    ]);
    expect(
      await adapter.getCachedEmbeddings({ ...params, query_match_count: 0 }),
    ).toEqual([]);
    await expect(
      adapter.getCachedEmbeddings({ ...params, query_field_name: "$where" }),
    ).rejects.toThrow("property names");
  });

  test("goals preserve objectives and scope updates/deletion to the requested records", async () => {
    const first = goal();
    const second = goal({ user_id: otherUser });
    const outsider = goal({ room_id: otherRoom });
    for (const value of [first, second, outsider])
      await adapter.createGoal(value);
    await adapter.updateGoal({
      ...first,
      name: "Updated",
      objectives: [{ description: "First", completed: true }],
    });
    await adapter.updateGoalStatus({
      goalId: first.id!,
      status: GoalStatus.DONE,
    });
    expect(
      await adapter.getGoals({ room_id: room, onlyInProgress: true }),
    ).toEqual([expect.objectContaining(second)]);
    expect(await adapter.getGoals({ room_id: room, user_id: user })).toEqual([
      expect.objectContaining({
        name: "Updated",
        status: GoalStatus.DONE,
        objectives: [{ description: "First", completed: true }],
      }),
    ]);
    await adapter.removeGoal(first.id!);
    await adapter.removeAllGoals(room);
    expect(await adapter.getGoals({ room_id: room })).toEqual([]);
    expect(await adapter.getGoals({ room_id: otherRoom })).toHaveLength(1);
  });

  test("large vector result limits respect MongoDB's 10000-candidate ceiling", async () => {
    const value = memory();
    await adapter.createMemory(value, "messages");
    await eventually(async () => {
      expect(
        await adapter.searchMemoriesByEmbedding([1, 0, 0], {
          tableName: "messages",
          room_id: room,
          count: 501,
        }),
      ).toEqual([expect.objectContaining(value)]);
    });
    await expect(
      adapter.searchMemoriesByEmbedding([1, 0, 0], {
        tableName: "messages",
        room_id: room,
        count: 10001,
      }),
    ).rejects.toThrow("cannot exceed 10000");
  }, 40000);

  test("cache character limits count Unicode code points instead of UTF-16 units", async () => {
    const input = "😀".repeat(128);
    await adapter.createMemory(
      memory({ content: { content: "😀".repeat(127) + "X" } }),
      "unicode_" + room,
    );
    expect(
      await adapter.getCachedEmbeddings({
        query_table_name: "unicode_" + room,
        query_input: input,
        query_threshold: 1,
        query_field_name: "content",
        query_field_sub_name: "content",
        query_match_count: 1,
      }),
    ).toEqual([{ embedding: [1, 0, 0], levenshtein_score: 1 }]);
  });

  test("relationships share a room, are symmetric and do not reuse an unrelated user's room", async () => {
    await adapter.addParticipant(user, room);
    await adapter.addParticipant(otherUser, otherRoom);
    await adapter.createRelationship({ userA: user, userB: otherUser });
    const relation = await adapter.getRelationship({
      userA: otherUser,
      userB: user,
    });
    expect(relation).toMatchObject({
      user_a: user,
      user_b: otherUser,
      status: "FRIENDS",
    });
    expect([room, otherRoom]).not.toContain(relation!.room_id);
    expect(await adapter.getParticipantsForRoom(relation!.room_id)).toEqual(
      expect.arrayContaining([user, otherUser]),
    );
    await adapter.createRelationship({ userA: otherUser, userB: user });
    expect(await adapter.getRelationships({ user_id: user })).toHaveLength(1);
    expect(
      await adapter.getRelationship({ userA: user, userB: randomUUID() }),
    ).toBeNull();
  });

  test("room removal atomically cleans dependent data and leaves other rooms intact", async () => {
    await adapter.addParticipant(user, room);
    await adapter.addParticipant(otherUser, room);
    await adapter.createRelationship({ userA: user, userB: otherUser });
    await adapter.createMemory(memory(), "messages");
    await adapter.createMemory(memory({ room_id: otherRoom }), "messages");
    await adapter.createGoal(goal());
    await adapter.log({
      body: { nested: { ok: true } },
      user_id: user,
      room_id: room,
      type: "test",
    });
    expect(
      await db.collection("logs").findOne({ room_id: room }),
    ).toMatchObject({ body: { nested: { ok: true } } });
    await adapter.removeRoom(room);
    expect(await adapter.getRoom(room)).toBeNull();
    expect(await adapter.getParticipantsForRoom(room)).toEqual([]);
    expect(await adapter.countMemories(room, false, "messages")).toBe(0);
    expect(await adapter.getGoals({ room_id: room })).toEqual([]);
    expect(await adapter.getRelationships({ user_id: user })).toEqual([]);
    expect(await db.collection("logs").countDocuments({ room_id: room })).toBe(
      0,
    );
    expect(await adapter.getRoom(otherRoom)).toBe(otherRoom);
    expect(await adapter.countMemories(otherRoom, false, "messages")).toBe(1);
  });

  test("concurrent reversed relationship creation has one relationship and shared room", async () => {
    await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        adapter.createRelationship({
          userA: index % 2 ? user : otherUser,
          userB: index % 2 ? otherUser : user,
        }),
      ),
    );
    const relationships = await adapter.getRelationships({ user_id: user });
    expect(relationships).toHaveLength(1);
    expect(await adapter.getRoomsForParticipant(user)).toEqual([
      relationships[0].room_id,
    ]);
    expect(
      await adapter.getParticipantsForRoom(relationships[0].room_id),
    ).toHaveLength(2);
  });

  test("missing embeddings stay optional and supplied timestamps sort by actual time", async () => {
    const early = memory({
      embedding: undefined,
      created_at: "2024-01-02T00:00:00+03:00",
    });
    const late = memory({ created_at: "2024-01-01T23:00:00.000Z" });
    await adapter.createMemory(early, "messages");
    await adapter.createMemory(late, "messages");
    const results = await adapter.getMemories({
      room_id: room,
      tableName: "messages",
    });
    expect(results.map((value) => value.id)).toEqual([late.id, early.id]);
    expect(results[1].embedding).toBeUndefined();
    expect(results[1].created_at).toBe("2024-01-01T21:00:00.000Z");
  });

  test("runtime MemoryManager works with precomputed vectors and no model service", async () => {
    const runtime = new BgentRuntime({
      databaseAdapter: adapter,
      token: "unused-local-test",
      serverUrl: "http://127.0.0.1:1",
      actions: [],
      evaluators: [],
      providers: [],
    });
    const message = memory();
    await runtime.messageManager.createMemory(message);
    expect(await runtime.messageManager.getMemories({ room_id: room })).toEqual(
      [expect.objectContaining(message)],
    );
    await eventually(async () => {
      expect(
        await runtime.messageManager.searchMemoriesByEmbedding([1, 0, 0], {
          room_id: room,
          count: 1,
        }),
      ).toEqual([expect.objectContaining(message)]);
    });
  }, 40000);
});

async function eventually(assertion: () => Promise<void>): Promise<void> {
  const deadline = Date.now() + 30000;
  let lastError: unknown;
  do {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  } while (Date.now() < deadline);
  throw lastError;
}

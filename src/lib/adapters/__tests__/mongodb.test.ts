import { MongoMemoryServer } from "mongodb-memory-server";

import { MongoDatabaseAdapter } from "../mongodb";
import { v4 as uuid } from "uuid";
import { GoalStatus, type Memory, type UUID } from "../../types";

describe("MongoDatabaseAdapter (integration)", () => {
  let mongod: MongoMemoryServer;
  let adapter: MongoDatabaseAdapter;
  let uri: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      binary: {
        version: "7.0.14",
      },
    });
    uri = mongod.getUri();
    adapter = new MongoDatabaseAdapter(uri, "test");
    await adapter.connect();
  }, 120000);

  afterAll(async () => {
    await adapter.disconnect();
    await mongod.stop();
  }, 30000);

  it("creates and fetches a room", async () => {
    const room = await adapter.createRoom();
    expect(room).toBeTruthy();
    const got = await adapter.getRoom(room);
    expect(got).toBe(room);
    await adapter.removeRoom(room);
    expect(await adapter.getRoom(room)).toBeNull();
  });

  it("creates and fetches an account + actor details", async () => {
    const id = uuid() as UUID;
    await adapter.createAccount({
      id,
      name: "Alice",
      email: "alice@test.dev",
      details: { tagline: "hi", summary: "s", quote: "q" },
    });
    const acc = await adapter.getAccountById(id);
    expect(acc?.name).toBe("Alice");

    const room = await adapter.createRoom();
    await adapter.addParticipant(id, room);
    const actors = await adapter.getActorDetails({ room_id: room });
    expect(actors.some((a) => a.name === "Alice")).toBe(true);
    expect(
      await adapter.getRoomsForParticipant(id),
    ).toContain(room);
    expect(await adapter.getParticipantsForRoom(room)).toContain(id);
    expect(await adapter.removeParticipant(id, room)).toBe(true);
    await adapter.removeRoom(room);
  });

  it("stores and vector-searches memories (cosine)", async () => {
    const room = await adapter.createRoom();
    const table = "facts";

    const memory: Memory = {
      id: uuid() as UUID,
      user_id: uuid() as UUID,
      room_id: room,
      content: { content: "the sky is blue" },
      embedding: [1, 0, 0],
    };
    await adapter.createMemory(memory, table, true);

    // near-identical duplicate should be skipped because unique=true
    await adapter.createMemory(
      { ...memory, id: uuid() as UUID, content: { content: "the sky is blue" }, embedding: [0.99, 0.1, 0] },
      table,
      true,
    );

    expect(await adapter.countMemories(room, true, table)).toBe(1);

    const search = await adapter.searchMemoriesByEmbedding([1, 0.05, 0], {
      tableName: table,
      room_id: room,
      match_threshold: 0.9,
      count: 5,
    });
    expect(search.length).toBe(1);
    expect(search[0].content.content).toBe("the sky is blue");

    expect((await adapter.getMemories({ room_id: room, tableName: table })).length).toBe(1);
    await adapter.removeAllMemories(room, table);
    expect(await adapter.countMemories(room, true, table)).toBe(0);
  });

  it("creates, updates and removes goals", async () => {
    const room = await createRoom();
    const goal = {
      id: uuid() as UUID,
      room_id: room as UUID,
      user_id: uuid() as UUID,
      name: "build mongo adapter",
      status: GoalStatus.IN_PROGRESS,
      objectives: [{ description: "impl", completed: false }],
    };
    await adapter.createGoal(goal as any);
    const goals = await adapter.getGoals({ room_id: room as UUID });
    expect(goals.length).toBe(1);
    expect(goals[0].status).toBe(GoalStatus.IN_PROGRESS);

    await adapter.updateGoalStatus({ goalId: goal.id as UUID, status: GoalStatus.DONE });
    const done = await adapter.getGoals({ room_id: room as UUID });
    expect(done[0].status).toBe(GoalStatus.DONE);

    await adapter.removeAllGoals(room as UUID);
    expect((await adapter.getGoals({ room_id: room as UUID })).length).toBe(0);

    async function createRoom(): Promise<UUID> {
      return adapter.createRoom();
    }
  });

  it("logs and relationships", async () => {
    const room = await adapter.createRoom();
    await adapter.log({ body: { k: 1 }, user_id: uuid() as UUID, room_id: room, type: "event" });

    const a = uuid() as UUID;
    const b = uuid() as UUID;
    expect(await adapter.createRelationship({ userA: a, userB: b })).toBe(true);
    const rel = await adapter.getRelationship({ userA: b, userB: a });
    expect(rel).not.toBeNull();
    expect((await adapter.getRelationships({ user_id: a })).length).toBe(1);
  });
});

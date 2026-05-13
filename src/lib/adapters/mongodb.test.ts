import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

import { zeroUuid, zeroUuidPlus1 } from "../constants";
import { MongoDbDatabaseAdapter } from "./mongodb";
import {
  GoalStatus,
  type Content,
  type Goal,
  type Memory,
  type UUID,
} from "../types";

jest.setTimeout(30000);

describe("MongoDbDatabaseAdapter", () => {
  let server: MongoMemoryServer;
  let client: MongoClient;
  let adapter: MongoDbDatabaseAdapter;
  let room_id: UUID;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = new MongoClient(server.getUri());
    await client.connect();
    adapter = new MongoDbDatabaseAdapter(client.db("bgent-test"));
    room_id = await adapter.createRoom(zeroUuid);
    await adapter.createAccount({
      id: zeroUuid,
      name: "Test User",
      details: {
        tagline: "test",
        summary: "test user",
        quote: "test quote",
      },
    });
    await adapter.createAccount({
      id: zeroUuidPlus1,
      name: "Test Agent",
      details: {
        tagline: "agent",
        summary: "test agent",
        quote: "agent quote",
      },
    });
    await adapter.addParticipant(zeroUuid, room_id);
    await adapter.addParticipant(zeroUuidPlus1, room_id);
  });

  beforeEach(async () => {
    await adapter.removeAllMemories(room_id, "messages");
    await adapter.removeAllGoals(room_id);
  });

  afterAll(async () => {
    await client?.close();
    await server?.stop();
  });

  test("stores accounts, rooms, participants, and actors", async () => {
    await expect(adapter.getRoom(room_id)).resolves.toBe(room_id);
    await expect(adapter.getAccountById(zeroUuid)).resolves.toMatchObject({
      id: zeroUuid,
      name: "Test User",
    });
    await expect(adapter.getParticipantsForRoom(room_id)).resolves.toEqual(
      expect.arrayContaining([zeroUuid, zeroUuidPlus1]),
    );

    const actors = await adapter.getActorDetails({ room_id });
    expect(actors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: zeroUuid, name: "Test User" }),
        expect.objectContaining({ id: zeroUuidPlus1, name: "Test Agent" }),
      ]),
    );
  });

  test("creates, retrieves, searches, counts, and removes memories", async () => {
    const similarMemory: Memory = {
      user_id: zeroUuid,
      room_id,
      content: { content: "MongoDB vector memory" },
      embedding: [1, 0, 0],
    };
    const dissimilarMemory: Memory = {
      user_id: zeroUuid,
      room_id,
      content: { content: "Unrelated memory" },
      embedding: [0, 1, 0],
    };

    await adapter.createMemory(similarMemory, "messages");
    await adapter.createMemory(dissimilarMemory, "messages");

    const memories = await adapter.getMemories({
      room_id,
      tableName: "messages",
      count: 10,
    });
    expect(memories).toHaveLength(2);
    expect(await adapter.countMemories(room_id, false, "messages")).toBe(2);

    const results = await adapter.searchMemories({
      tableName: "messages",
      room_id,
      embedding: [1, 0, 0],
      match_threshold: 0.1,
      match_count: 2,
      unique: false,
    });

    expect((results[0].content as Content).content).toBe(
      "MongoDB vector memory",
    );
    expect(
      (results[0] as Memory & { similarity: number }).similarity,
    ).toBeGreaterThan(0.99);

    await adapter.removeMemory(memories[0].id!, "messages");
    expect(await adapter.countMemories(room_id, false, "messages")).toBe(1);
  });

  test("marks near-duplicate memories as non-unique for unique inserts", async () => {
    const firstMemory: Memory = {
      user_id: zeroUuid,
      room_id,
      content: { content: "same fact" },
      embedding: [0.8, 0.2, 0],
    };
    const duplicateMemory: Memory = {
      user_id: zeroUuid,
      room_id,
      content: { content: "same fact again" },
      embedding: [0.8, 0.2, 0],
    };

    await adapter.createMemory(firstMemory, "messages", true);
    await adapter.createMemory(duplicateMemory, "messages", true);

    expect(await adapter.countMemories(room_id, false, "messages")).toBe(2);
    expect(await adapter.countMemories(room_id, true, "messages")).toBe(1);
  });

  test("manages goals and relationships", async () => {
    const goal: Goal = {
      room_id,
      user_id: zeroUuid,
      name: "Ship MongoDB adapter",
      status: GoalStatus.IN_PROGRESS,
      objectives: [
        {
          description: "Add adapter",
          completed: false,
        },
      ],
    };

    await adapter.createGoal(goal);
    const goals = await adapter.getGoals({
      room_id,
      user_id: zeroUuid,
      onlyInProgress: true,
    });
    expect(goals).toHaveLength(1);

    await adapter.updateGoal({
      ...goals[0],
      status: GoalStatus.DONE,
      objectives: [{ description: "Add adapter", completed: true }],
    });
    await adapter.updateGoalStatus({
      goalId: goals[0].id!,
      status: GoalStatus.FAILED,
    });
    expect(
      await adapter.getGoals({
        room_id,
        user_id: zeroUuid,
        onlyInProgress: true,
      }),
    ).toHaveLength(0);

    await adapter.createRelationship({
      userA: zeroUuid,
      userB: zeroUuidPlus1,
    });
    await expect(
      adapter.getRelationship({ userA: zeroUuid, userB: zeroUuidPlus1 }),
    ).resolves.toMatchObject({
      user_a: zeroUuid,
      user_b: zeroUuidPlus1,
      status: "FRIENDS",
    });
  });
});

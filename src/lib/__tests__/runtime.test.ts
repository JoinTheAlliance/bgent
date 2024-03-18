import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { type UUID } from "crypto";
import { createRelationship, getRelationship } from "../relationships";
import { getCachedEmbedding, writeCachedEmbedding } from "../../test/cache";
import { BgentRuntime } from "../runtime";
import { type User } from "../../test/types";
import { type Message } from "../types";
import { zeroUuid } from "../constants";

dotenv.config({ path: ".dev.vars" });

describe("Agent Runtime", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID = zeroUuid;

  // Helper function to clear memories
  async function clearMemories() {
    await runtime.messageManager.removeAllMemoriesByRoomId(room_id);
  }

  // Helper function to create memories
  async function createMemories() {
    const memories = [
      {
        userId: user?.id as UUID,
        content: { content: "test memory from user" },
      },
      { userId: zeroUuid, content: { content: "test memory from agent" } },
    ];

    for (const { userId, content } of memories) {
      try {
        const embedding = getCachedEmbedding(content.content);
        const memory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: userId,
          content,
          room_id,
          embedding,
        });
        if (!embedding) {
          writeCachedEmbedding(content.content, memory.embedding as number[]);
        }
        await runtime.messageManager.createMemory(memory);
      } catch (error) {
        console.error("Error creating memory", error);
      }
    }
  }

  // Set up before each test
  beforeEach(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });

    runtime = result.runtime;
    user = result.session.user;

    let data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      await createRelationship({
        runtime,
        userA: user?.id as UUID,
        userB: zeroUuid,
      });
      data = await getRelationship({
        runtime,
        userA: user?.id as UUID,
        userB: zeroUuid,
      });
    }

    console.log("data", data);

    room_id = data?.room_id as UUID;
    await clearMemories(); // Clear memories before each test
  });

  // Clean up after each test
  afterEach(async () => {
    await clearMemories(); // Clear memories after each test to ensure a clean state
  });

  test("Create an agent runtime instance and use the basic functionality", () => {
    expect(user).toBeDefined();
    expect(runtime).toBeDefined();
  });

  test("Demonstrate idempotency by creating an agent runtime instance again", () => {
    expect(user).toBeDefined();
    expect(runtime).toBeDefined();
  });

  test("Memory lifecycle: create, retrieve, and destroy", async () => {
    try {
      await createMemories(); // Create new memories
    } catch (error) {
      console.error("Error creating memories", error);
    }

    console.log("room_id", room_id);

    const message: Message = {
      userId: user.id as UUID,
      content: { content: "test message" },
      room_id: room_id as UUID,
    };

    const state = await runtime.composeState(message);

    expect(state.recentMessagesData.length).toBeGreaterThan(1);

    await clearMemories();
  });
});

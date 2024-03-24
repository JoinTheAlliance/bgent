import dotenv from "dotenv";
import { getCachedEmbeddings, writeCachedEmbedding } from "../../test/cache";
import { createRuntime } from "../../test/createRuntime";
import { getOrCreateRelationship } from "../../test/getOrCreateRelationship";
import { type User } from "../../test/types";
import { zeroUuid } from "../constants";
import { BgentRuntime } from "../runtime";
import { type Message, type UUID } from "../types";

dotenv.config({ path: ".dev.vars" });

describe("Agent Runtime", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID = zeroUuid;

  // Helper function to clear memories
  async function clearMemories() {
    await runtime.messageManager.removeAllMemories(room_id);
  }

  // Helper function to create memories
  async function createMemories() {
    const memories = [
      {
        user_id: user?.id as UUID,
        content: { content: "test memory from user" },
      },
      { user_id: zeroUuid, content: { content: "test memory from agent" } },
    ];

    for (const { user_id, content } of memories) {
      try {
        const embedding = await getCachedEmbeddings(content.content);
        const memory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: user_id,
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

    const data = await getOrCreateRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      throw new Error("Relationship not found");
    }
    room_id = data.room_id;
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

    const message: Message = {
      user_id: user.id as UUID,
      content: { content: "test message" },
      room_id: room_id as UUID,
    };

    const state = await runtime.composeState(message);

    expect(state.recentMessagesData.length).toBeGreaterThan(1);

    await clearMemories();
  }, 60000);
});

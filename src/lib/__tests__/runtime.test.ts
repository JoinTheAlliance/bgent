import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { type UUID } from "crypto";
import { getRelationship } from "../relationships";
import { getCachedEmbedding, writeCachedEmbedding } from "../../test/cache";
import { BgentRuntime } from "../runtime";
import { type User } from "@supabase/supabase-js";
import { type Message } from "../types";

dotenv.config({ path: ".dev.vars" });

describe("Agent Runtime", () => {
  const zeroUuid: UUID = "00000000-0000-0000-0000-000000000000";
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  // Helper function to clear memories
  async function clearMemories() {
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
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
      const embedding = getCachedEmbedding(content.content);
      const memory = await runtime.messageManager.addEmbeddingToMemory({
        user_id: userId,
        user_ids: [user?.id as UUID, zeroUuid],
        content,
        room_id,
        embedding,
      });
      if (!embedding) {
        writeCachedEmbedding(content.content, memory.embedding as number[]);
      }
      await runtime.messageManager.createMemory(memory);
    }
  }

  // Set up before each test
  beforeEach(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });

    runtime = result.runtime;
    user = result.session.user;

    const data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;
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
    await createMemories(); // Create new memories

    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: { content: "test message" },
      room_id: room_id as UUID,
    };

    const state = await runtime.composeState(message);

    expect(state.recentMessagesData.length).toBeGreaterThan(1);

    await clearMemories();
  });
});

import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { getCachedEmbedding, writeCachedEmbedding } from "../../../test/cache";
import { createRuntime } from "../../../test/createRuntime";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { type Message } from "../../types";
import action from "../continue";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000";

describe("User Profile", () => {
  let user: User | null;
  let runtime: BgentRuntime;
  let room_id: UUID | null;

  afterAll(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime();
    user = setup.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      supabase: runtime.supabase,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;

    await cleanup();
  });

  async function cleanup() {
    await runtime.summarizationManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  }

  async function populateMemories(
    conversations: Array<
      (user_id: string) => Array<{ user_id: string; content: string }>
    >,
  ) {
    for (const conversation of conversations) {
      for (const c of conversation(user?.id as UUID)) {
        const existingEmbedding = getCachedEmbedding(c.content);
        const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: c.user_id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: {
            content: c.content,
          },
          room_id: room_id as UUID,
          embedding: existingEmbedding,
        });
        await runtime.messageManager.createMemory(bakedMemory);
        if (!existingEmbedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }
  }

  test("Test ignore action", async () => {
    const message: Message = {
      senderId: zeroUuid as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: { content: "", action: "CONTINUE" },
      room_id: room_id as UUID,
    };

    await populateMemories([]);

    const handler = action.handler!;

    const result = (await handler(runtime, message)) as string[];
    expect(result).toBe(true);
  }, 60000);
});

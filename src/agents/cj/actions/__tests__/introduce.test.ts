// test creating an agent runtime
import dotenv from "dotenv";

import { type UUID } from "crypto";
import { getRelationship } from "../../../../lib/relationships";
import { type Message } from "../../../../lib/types";
import { createRuntime } from "../../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
  jimProfileExample1,
  jimProfileExample2,
} from "../../../../test/data";

import evaluator from "../introduce";
import {
  getCachedEmbedding,
  writeCachedEmbedding,
} from "../../../../test/cache";
dotenv.config();

// create a UUID of 0s
const zeroUuid = "00000000-0000-0000-0000-000000000000";

describe("Introduce Action", () => {
  test("Introduce the user", async () => {
    const { user, runtime } = await createRuntime(
      process.env as Record<string, string>,
    );

    const data = await getRelationship({
      supabase: runtime.supabase,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    const room_id = data?.room_id;

    const message: Message = {
      senderId: user?.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "",
      room_id,
    };

    //

    async function _cleanup() {
      await runtime.messageManager.removeAllMemoriesByUserIds([
        user?.id as UUID,
        zeroUuid,
      ]);
    }

    async function _testCreateProfile() {
      // first, add all the memories for conversation
      let conversation = GetTellMeAboutYourselfConversation1(user?.id as UUID);
      for (let i = 0; i < conversation.length; i++) {
        const c = conversation[i];
        const existingEmbedding = getCachedEmbedding(c.content);

        const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: c.user_id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: {
            content: c.content,
          },
          room_id,
          embedding: existingEmbedding,
        });
        await runtime.messageManager.createMemory(bakedMemory);
        if (!existingEmbedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      const handler = evaluator.handler!;

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      let result = (await handler(runtime, message)) as unknown as string;

      expect(result.includes("programmer")).toBe(true);

      expect(result.includes("Jim")).toBe(true);

      expect(result.toLowerCase().includes("startup")).toBe(true);

      conversation = [
        ...GetTellMeAboutYourselfConversation2(user?.id as UUID),
        ...GetTellMeAboutYourselfConversation3(user?.id as UUID),
      ];
      for (let i = 0; i < conversation.length; i++) {
        const c = conversation[i];
        const existingEmbedding = getCachedEmbedding(c.content);
        const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: c.user_id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: {
            content: c.content,
          },
          room_id,
          embedding: existingEmbedding,
        });
        await runtime.messageManager.createMemory(bakedMemory);
        if (!existingEmbedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      const previousDescriptions = [jimProfileExample1, jimProfileExample2];

      // for each description in previousDescriptions, add it to the memory
      for (let i = 0; i < previousDescriptions.length; i++) {
        const c = previousDescriptions[i];
        const bakedMemory =
          await runtime.descriptionManager.addEmbeddingToMemory({
            user_id: user?.id as UUID,
            user_ids: [user?.id as UUID, zeroUuid],
            content: c,
            room_id,
          });
        await runtime.descriptionManager.createMemory(bakedMemory);
        // wait for .2 seconds
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      // TODO: fix this
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      result = (await handler(runtime, message)) as unknown as string;

      expect(result.includes("38")).toBe(true);

      expect(result.includes("Jim")).toBe(true);

      expect(result.toLowerCase().includes("francisco")).toBe(true);

      expect(result.toLowerCase().includes("startup")).toBe(true);
    }

    // first, destroy all memories where the user_id is TestUser
    await _cleanup();

    await _testCreateProfile();

    // then destroy all memories again
    await _cleanup();
  }, 60000);
});

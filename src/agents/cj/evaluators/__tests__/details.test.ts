import dotenv from "dotenv";

import { type UUID } from "crypto";
import { getRelationship } from "../../../../lib/relationships";
import { type Message } from "../../../../lib/types";
import { createRuntime } from "../../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
} from "../../../../test/data";

import evaluator from "../details";
import {
  getCachedEmbedding,
  writeCachedEmbedding,
} from "../../../../test/cache";
dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;

describe("User Details", () => {
  test("Get user details", async () => {
    const { user, runtime } = await createRuntime(
      process.env as Record<string, string>,
      24,
    );

    const data = await getRelationship({
      runtime,
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

    async function _testGetDetails() {
      let conversation = GetTellMeAboutYourselfConversation1(user?.id as UUID);
      for (let i = 0; i < conversation.length; i++) {
        const c = conversation[i];
        const embedding = getCachedEmbedding(c.content);
        const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: c.user_id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: {
            content: c.content,
          },
          room_id,
          embedding,
        });
        await runtime.messageManager.createMemory(bakedMemory);
        if (!embedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      const handler = evaluator.handler!;

      let result = (await handler(runtime, message)) as {
        name: string;
        age: string;
        gender: string;
        location: string;
      };

      expect(result.name).toBe("Jim");
      conversation = [
        ...GetTellMeAboutYourselfConversation2(user?.id as UUID),
        ...GetTellMeAboutYourselfConversation3(user?.id as UUID),
      ];
      for (let i = 0; i < conversation.length; i++) {
        const c = conversation[i];
        const embedding = getCachedEmbedding(c.content);
        const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
          user_id: c.user_id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: {
            content: c.content,
          },
          room_id,
          embedding,
        });
        if (!embedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
        }
        await runtime.messageManager.createMemory(bakedMemory);
      }

      result = (await handler(runtime, message)) as {
        name: string;
        age: string;
        gender: string;
        location: string;
      };

      console.log("result", result);

      expect(result.name).toBe("Jim");
      expect(result.age).toBe(38);
      const locationIncludesSanFrancisco = result.location
        .toLowerCase()
        .includes("francisco");
      expect(locationIncludesSanFrancisco).toBe(true);
    }

    await _cleanup();

    await _testGetDetails();

    await _cleanup();
  }, 60000);
});

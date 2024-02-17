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

import { BgentRuntime } from "../../../../lib/runtime";
import { User } from "@supabase/supabase-js";
import {
  getCachedEmbedding,
  writeCachedEmbedding,
} from "../../../../test/cache";
import evaluator from "../profile";

dotenv.config();

const zeroUuid: UUID = "00000000-0000-0000-0000-000000000000";
let runtime: BgentRuntime;
let user: User;

describe("User Profile", () => {
  beforeAll(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = result.runtime;
    user = result.session.user;
  });

  beforeEach(async () => {
    await runtime.descriptionManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  });

  afterAll(async () => {
    await runtime.descriptionManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  });

  test("Get user profile", async () => {
    const { user, runtime } = await createRuntime({
      env: process.env as Record<string, string>,
    });

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
        // wait for .2 seconds
        if (!existingEmbedding) {
          writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      const handler = evaluator.handler!;

      let result = (await handler(runtime, message)) as string;

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
        const existingEmbedding = getCachedEmbedding(c);
        const bakedMemory =
          await runtime.descriptionManager.addEmbeddingToMemory({
            user_id: user?.id as UUID,
            user_ids: [user?.id as UUID, zeroUuid],
            content: c,
            room_id,
            embedding: existingEmbedding,
          });
        await runtime.descriptionManager.createMemory(bakedMemory);
        // wait for .2 seconds
        if (!existingEmbedding) {
          writeCachedEmbedding(c, bakedMemory.embedding as number[]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      result = (await handler(runtime, message)) as string;

      expect(result.includes("38")).toBe(true);

      expect(result.includes("Jim")).toBe(true);

      expect(result.toLowerCase().includes("francisco")).toBe(true);

      expect(
        result.toLowerCase().includes("startup") ||
        result.toLowerCase().includes("programmer"),
      ).toBe(true);

      const descriptions = await runtime.descriptionManager.getMemoriesByIds({
        userIds: [message.senderId, message.agentId] as UUID[],
        count: 5,
      });

      //count the number of descriptions
      expect(descriptions.length).toBe(3);
    }

    await _testCreateProfile();
  }, 60000);
});

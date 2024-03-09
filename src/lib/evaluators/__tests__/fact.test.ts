import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import {
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
  jimFacts,
} from "../../../test/data";
import { populateMemories } from "../../../test/populateMemories";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { createRuntime } from "../../../test/createRuntime";
import { runAiTest } from "../../../test/runAiTest";
import evaluator from "../fact";
import { type Message } from "../../types";
import { getCachedEmbedding, writeCachedEmbedding } from "../../../test/cache";
import { defaultActions } from "../../actions";
import { zeroUuid } from "../../constants";

dotenv.config({ path: ".dev.vars" });

describe("Facts Evaluator", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      evaluators: [evaluator],
      actions: defaultActions,
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      runtime,
      userA: user.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      throw new Error("Relationship not found");
    }

    room_id = data.room_id;
  });

  afterAll(async () => {
    await cleanup(runtime, user.id as UUID);
  });

  test("Extract facts from conversations", async () => {
    await runAiTest("Extract programmer and startup facts", async () => {
      await populateMemories(runtime, user, room_id, [
        GetTellMeAboutYourselfConversation1,
      ]);

      const message: Message = {
        senderId: user.id as UUID,
        agentId: zeroUuid,
        userIds: [user.id as UUID, zeroUuid],
        content: { content: "" },
        room_id,
      };

      const result = await evaluator.handler(runtime, message);
      const resultConcatenated = result.join("\n");

      return (
        resultConcatenated.toLowerCase().includes("programmer") &&
        resultConcatenated.toLowerCase().includes("startup")
      );
    });

    await runAiTest("Extract married fact, ignoring known facts", async () => {
      await populateMemories(runtime, user, room_id, [
        GetTellMeAboutYourselfConversation2,
        GetTellMeAboutYourselfConversation3,
      ]);

      await addFacts(runtime, user.id as UUID, room_id, jimFacts);

      const message: Message = {
        senderId: user.id as UUID,
        agentId: zeroUuid,
        userIds: [user.id as UUID, zeroUuid],
        content: { content: "" },
        room_id,
      };

      const result = await evaluator.handler(runtime, message);
      const resultConcatenated = result.join("\n");

      return (
        !resultConcatenated.toLowerCase().includes("francisco") &&
        !resultConcatenated.toLowerCase().includes("38") &&
        resultConcatenated.toLowerCase().includes("married")
      );
    });
  }, 120000); // Adjust the timeout as needed for your tests
});

async function cleanup(runtime: BgentRuntime, userId: UUID) {
  await runtime.factManager.removeAllMemoriesByUserIds([userId, zeroUuid]);
  await runtime.messageManager.removeAllMemoriesByUserIds([userId, zeroUuid]);
}

async function addFacts(
  runtime: BgentRuntime,
  userId: UUID,
  room_id: UUID,
  facts: string[],
) {
  for (const fact of facts) {
    const existingEmbedding = getCachedEmbedding(fact);
    const bakedMemory = await runtime.factManager.addEmbeddingToMemory({
      user_id: userId,
      user_ids: [userId, zeroUuid],
      content: { content: fact },
      room_id: room_id,
      embedding: existingEmbedding,
    });
    await runtime.factManager.createMemory(bakedMemory);
    if (!existingEmbedding) {
      writeCachedEmbedding(fact, bakedMemory.embedding as number[]);
      // Ensure there's a slight delay for asynchronous operations to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

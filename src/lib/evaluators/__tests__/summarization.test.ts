import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { getCachedEmbedding, writeCachedEmbedding } from "../../../test/cache";
import { createRuntime } from "../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
  jimFacts,
} from "../../../test/data";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { type Message } from "../../types";
import evaluator from "../summarization";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000";

describe("Factual Summarization", () => {
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

  async function addFacts(facts: string[]) {
    for (const fact of facts) {
      const existingEmbedding = getCachedEmbedding(fact);
      const bakedMemory =
        await runtime.summarizationManager.addEmbeddingToMemory({
          user_id: user?.id as UUID,
          user_ids: [user?.id as UUID, zeroUuid],
          content: fact,
          room_id: room_id as UUID,
          embedding: existingEmbedding,
        });
      await runtime.summarizationManager.createMemory(bakedMemory);
      if (!existingEmbedding) {
        writeCachedEmbedding(fact, bakedMemory.embedding as number[]);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  test("Get user profile", async () => {
    const message: Message = {
      senderId: user?.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "",
      room_id: room_id as UUID,
    };

    const handler = evaluator.handler!;

    await populateMemories([GetTellMeAboutYourselfConversation1]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = (await handler(runtime, message)) as string[];
    const resultConcatenated = result.join("\n");

    // const state = await runtime.composeState(message);
    // console.log("************ state.recentMessages\n", state.recentMessages);
    // console.log("************ resultConcatenated\n", resultConcatenated);

    // console.log("Expecting the facts to contain programmer and Jim");
    expect(resultConcatenated.toLowerCase()).toMatch(/programmer|startup/);
    expect(resultConcatenated.toLowerCase()).toMatch(/jim/);

    //

    await populateMemories([
      GetTellMeAboutYourselfConversation2,
      GetTellMeAboutYourselfConversation3,
    ]);

    await addFacts(jimFacts);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result2 = (await handler(runtime, message)) as string[];
    const resultConcatenated2 = result2.join("\n");

    // const state2 = await runtime.composeState(message);
    // console.log("************ state.recentMessages\n", state2.recentMessages);
    // console.log("************ resultConcatenated2\n", resultConcatenated2);
    // console.log("Expecting the facts to contain francisco");

    // expect result to ignore 'francisco' and '38' since they are already known
    expect(resultConcatenated2.toLowerCase()).not.toMatch(/francisco/);
    expect(resultConcatenated2.toLowerCase()).not.toMatch(/38/);

    // expect result to contain 'married' since it is not already known
    expect(resultConcatenated2.toLowerCase()).toMatch(/married/);
  }, 60000);
});

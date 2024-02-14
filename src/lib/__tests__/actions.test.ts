import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { getCachedEmbedding, writeCachedEmbedding } from "../../test/cache";
import { createRuntime } from "../../test/createRuntime";
import { getRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { Content, type Message } from "../types";
import { GetTellMeAboutYourselfConversationTroll1 } from "../../test/data";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000";

describe("User Profile", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  afterAll(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime();
    user = setup.session.user;
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
    await runtime.reflectionManager.removeAllMemoriesByUserIds([
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

  test("Action handler test: ignore", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: '',
      room_id: room_id as UUID
    }

    await populateMemories([
      GetTellMeAboutYourselfConversationTroll1
    ]);

    await runtime.handleRequest(message);

    const state = await runtime.composeState(message);

    console.log('state.recentMessagesData', state.recentMessagesData)

    const lastMessage = state.recentMessagesData[state.recentMessagesData.length - 1]
    expect((lastMessage.content as Content).action).toBe('ignore')
  }, 60000);

  test("Action handler test: continue", async () => {
    // TODO: test action handler with a message that should continue the conversation
    // evaluate that the response action is a continue

    // const message: Message = {
    //   senderId: user.id as UUID,
    //   agentId: zeroUuid,
    //   userIds: [user?.id as UUID, zeroUuid],
    //   content: '',
    //   room_id: room_id as UUID
    // }

    await populateMemories([
      // continue conversation 1 (should continue)
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // const result = (await handler(runtime, message)) as string[]
    // const resultConcatenated = result.join('\n')

    // const state = await runtime.composeState(message)

    // test continue, ignore, wait at expected times

    // test an example action being included in the template


    // load in three continues in a row and verify that they should not continue

  }, 60000);

  test("Action handler test: wait", async () => {
    // const message: Message = {
    //   senderId: user.id as UUID,
    //   agentId: zeroUuid,
    //   userIds: [user?.id as UUID, zeroUuid],
    //   content: '',
    //   room_id: room_id as UUID
    // }

        // TODO: test action handler with a message that should wait for a response
    // evaluate that the response action is a wait


    await populateMemories([
      // continue conversation 1 (should wait)
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    // const result = (await handler(runtime, message)) as string[]
    // const resultConcatenated = result.join('\n')

    // const state = await runtime.composeState(message)

    // test continue, ignore, wait at expected times

    // test an example action being included in the template
  }, 60000);
});

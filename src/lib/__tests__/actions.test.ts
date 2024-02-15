import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { getRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { populateMemories } from "../../test/populateMemories";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;

describe("Actions", () => {
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
    await runtime.summarizationManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  }

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

    await populateMemories(runtime, user, room_id, [
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

    await populateMemories(runtime, user, room_id, [
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

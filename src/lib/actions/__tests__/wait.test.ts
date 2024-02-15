import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { getCachedEmbedding, writeCachedEmbedding } from "../../../test/cache";
import { createRuntime } from "../../../test/createRuntime";
import { GetTellMeAboutYourselfConversation1 } from "../../../test/data";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { type Message } from "../../types";
import action from "../wait"; // Import the wait action
import { populateMemories } from "test/populateMemories";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;

describe("Wait Action Behavior", () => {
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

  test("Test wait action behavior", async () => {
    const message: Message = {
      senderId: zeroUuid as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: {
        content: "Please wait a moment, I need to think about this...",
        action: "WAIT",
      },
      room_id: room_id as UUID,
    };

    const handler = action.handler!;

    await populateMemories(runtime, user, room_id, [GetTellMeAboutYourselfConversation1]);

    const result = (await handler(runtime, message)) as string[];
    // Expectation depends on the implementation of the wait action.
    // For instance, it might be that there's no immediate output,
    // or the output indicates waiting, so adjust the expectation accordingly.
    expect(result).toEqual(true); // Update this line based on the expected behavior of the wait action
  }, 60000);
});

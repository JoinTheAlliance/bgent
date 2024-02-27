import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversationTroll1,
  GetTellMeAboutYourselfConversationTroll2,
  Goodbye1,
} from "../../../test/data";
import { populateMemories } from "../../../test/populateMemories";
import { runAiTest } from "../../../test/runAiTest";
import { zeroUuid } from "../../constants";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { Content, type Message } from "../../types";
import action from "../ignore";

// use .dev.vars for local testing
dotenv.config({ path: ".dev.vars" });

describe("Ignore action tests", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  afterAll(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      actions: [action],
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;

    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    await runtime.factManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  }

  test("Test ignore action", async () => {
    await runAiTest("Test ignore action", async () => {
      const message: Message = {
        senderId: user?.id as UUID,
        agentId: zeroUuid,
        userIds: [user?.id as UUID, zeroUuid],
        content: { content: "Never talk to me again" },
        room_id: room_id as UUID,
      };

      await populateMemories(runtime, user, room_id, [
        GetTellMeAboutYourselfConversationTroll1,
      ]);

      const result = await runtime.handleMessage(message);

      return result.action === "IGNORE";
    });
  }, 60000);

  test("Action handler test 1: response should be ignore", async () => {
    await runAiTest(
      "Action handler test 1: response should be ignore",
      async () => {
        const message: Message = {
          senderId: user.id as UUID,
          agentId: zeroUuid,
          userIds: [user?.id as UUID, zeroUuid],
          content: { content: "" },
          room_id: room_id as UUID,
        };

        await populateMemories(runtime, user, room_id, [
          GetTellMeAboutYourselfConversationTroll1,
        ]);

        await runtime.handleMessage(message);

        const state = await runtime.composeState(message);

        const lastMessage = state.recentMessagesData[0];

        return (lastMessage.content as Content).action === "IGNORE";
      },
    );
  }, 60000);

  test("Action handler test 2: response should be ignore", async () => {
    await runAiTest(
      "Action handler test 2: response should be ignore",
      async () => {
        const message: Message = {
          senderId: user.id as UUID,
          agentId: zeroUuid,
          userIds: [user?.id as UUID, zeroUuid],
          content: { content: "" },
          room_id: room_id as UUID,
        };

        await populateMemories(runtime, user, room_id, [
          GetTellMeAboutYourselfConversationTroll2,
        ]);

        await runtime.handleMessage(message);

        const state = await runtime.composeState(message);

        const lastMessage = state.recentMessagesData[0];

        return (lastMessage.content as Content).action === "IGNORE";
      },
    );
  }, 60000);

  test("Expect ignore", async () => {
    await runAiTest("Expect ignore", async () => {
      const message: Message = {
        senderId: user.id as UUID,
        agentId: zeroUuid,
        userIds: [user?.id as UUID, zeroUuid],
        content: { content: "Bye" },
        room_id: room_id as UUID,
      };

      await populateMemories(runtime, user, room_id, [Goodbye1]);

      await runtime.handleMessage(message);

      const state = await runtime.composeState(message);

      const lastMessage = state.recentMessagesData[0];

      return (lastMessage.content as Content).action === "IGNORE";
    });
  }, 60000);
});

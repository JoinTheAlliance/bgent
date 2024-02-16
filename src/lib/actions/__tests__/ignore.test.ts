import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversationTroll1,
  GetTellMeAboutYourselfConversationTroll2,
  Goodbye1,
} from "../../../test/data";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { Content, type Message } from "../../types";
// import action from "../ignore";
import { populateMemories } from "../../../test/populateMemories";

dotenv.config();

export const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;

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

  beforeEach(async () => {
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

  test("Test ignore action", async () => {
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

    const result = await runtime.handleRequest(message);
    console.log("*** result", result);

    expect(result.action).toBe("IGNORE");
  }, 60000);

  test("Action handler test 1: response should be ignore", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "",
      room_id: room_id as UUID,
    };

    await populateMemories(runtime, user, room_id, [
      GetTellMeAboutYourselfConversationTroll1,
    ]);

    await runtime.handleRequest(message);

    const state = await runtime.composeState(message);

    const lastMessage = state.recentMessagesData[0];

    expect((lastMessage.content as Content).action).toBe("IGNORE");
  }, 60000);

  test("Action handler test 2: response should be ignore", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "",
      room_id: room_id as UUID,
    };

    await populateMemories(runtime, user, room_id, [
      GetTellMeAboutYourselfConversationTroll2,
    ]);

    await runtime.handleRequest(message);

    const state = await runtime.composeState(message);

    const lastMessage = state.recentMessagesData[0];

    expect((lastMessage.content as Content).action).toBe("IGNORE");
  }, 60000);

  test("Expect ignore", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "Bye",
      room_id: room_id as UUID,
    };

    await populateMemories(runtime, user, room_id, [Goodbye1]);

    const response = await runtime.handleRequest(message);

    const state = await runtime.composeState(message);

    console.log(
      "*** recentMessagesData",
      state.recentMessagesData.map((m) => m.content),
    );

    console.log("*** response", response);

    const lastMessage = state.recentMessagesData[0];

    console.log("*** lastMessage", lastMessage.content);

    expect((lastMessage.content as Content).action).toBe("IGNORE");
  }, 60000);
});

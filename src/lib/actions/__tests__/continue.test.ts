import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import { Goodbye1 } from "../../../test/data";
import { populateMemories } from "../../../test/populateMemories";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { Content, type Message } from "../../types";
import action from "../continue";

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000" as UUID;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GetContinueExample1 = (_user_id: UUID) => [
  {
    user_id: zeroUuid,
    content:
      "Hmm, let think for a second, I was going to tell you about something...",
    action: "CONTINUE",
  },
  {
    user_id: zeroUuid,
    content:
      "I remember now, I was going to tell you about my favorite food, which is pizza.",
    action: "CONTINUE",
  },
  {
    user_id: zeroUuid,
    content: "I love pizza, it's so delicious.",
    action: "CONTINUE",
  },
];

describe("User Profile", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  afterAll(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      runtime,
      userA: user.id,
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
      user.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user.id as UUID,
      zeroUuid,
    ]);
  }

  // test validate function response
  test("Test validate function response", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: {
        content: "Hello",
      },
      room_id: room_id as UUID,
    };

    const validate = action.validate!;

    const result = await validate(runtime, message);

    expect(result).toBe(true);

    // try again with GetContinueExample1, expect to be false
    await populateMemories(runtime, user, room_id, [GetContinueExample1]);

    const message2: Message = {
      senderId: zeroUuid as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: {
        content: "Hello",
        action: "CONTINUE",
      },
      room_id: room_id as UUID,
    };

    const result2 = await validate(runtime, message2);

    console.log("result2", result2);

    expect(result2).toBe(false);
  }, 20000);

  test("Test repetition check on continue", async () => {
    const message: Message = {
      senderId: zeroUuid as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: {
        content:
          "Hmm, let think for a second, I was going to tell you about something...",
        action: "CONTINUE",
      },
      room_id: room_id as UUID,
    };

    const handler = action.handler!;

    await populateMemories(runtime, user, room_id, [GetContinueExample1]);

    const result = (await handler(runtime, message)) as Content;

    expect(result.action).not.toBe("CONTINUE");
  }, 20000);

  test("Test if not continue", async () => {
    // this is basically the same test as the one in ignore.test.ts
    const message: Message = {
      senderId: user?.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "Bye",
      room_id: room_id as UUID,
    };

    const handler = action.handler!;

    await populateMemories(runtime, user, room_id, [Goodbye1]);

    const result = (await handler(runtime, message)) as Content;

    console.log("IGNORE result", result);

    expect(result.action).toBe("IGNORE");
  }, 20000);

  // test conditions where we would expect a wait or an ignore
});

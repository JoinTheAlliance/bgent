import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import { Goodbye1 } from "../../../test/data";
import { getOrCreateRelationship } from "../../../test/getOrCreateRelationship";
import { populateMemories } from "../../../test/populateMemories";
import { runAiTest } from "../../../test/runAiTest";
import { type User } from "../../../test/types";
import { zeroUuid } from "../../constants";
import { type BgentRuntime } from "../../runtime";
import { Content, type Message, type UUID } from "../../types";
import action from "../elaborate";
import ignore from "../ignore";
import wait from "../wait";

dotenv.config({ path: ".dev.vars" });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GetContinueExample1 = (_user_id: UUID) => [
  {
    user_id: zeroUuid,
    content: {
      content:
        "Hmm, let think for a second, I was going to tell you about something...",
      action: "ELABORATE",
    },
  },
  {
    user_id: zeroUuid,
    content: {
      content:
        "I remember now, I was going to tell you about my favorite food, which is pizza.",
      action: "ELABORATE",
    },
  },
  {
    user_id: zeroUuid,
    content: {
      content: "I love pizza, it's so delicious.",
      action: "ELABORATE",
    },
  },
];

describe("User Profile", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID = zeroUuid;

  afterAll(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      actions: [action, ignore, wait],
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getOrCreateRelationship({
      runtime,
      userA: user.id as UUID,
      userB: zeroUuid,
    });

    console.log("data", data);

    room_id = data.room_id;

    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    await runtime.factManager.removeAllMemories(room_id);
    await runtime.messageManager.removeAllMemories(room_id);
  }

  // test validate function response

  test("Test validate function response", async () => {
    await runAiTest("Test validate function response", async () => {
      const message: Message = {
        user_id: user.id as UUID,
        content: { content: "Hello", action: "WAIT" },
        room_id: room_id as UUID,
      };

      const validate = action.validate!;

      const result = await validate(runtime, message);

      // try again with GetContinueExample1, expect to be false
      await populateMemories(runtime, user, room_id, [GetContinueExample1]);

      const message2: Message = {
        user_id: zeroUuid as UUID,
        content: {
          content: "Hello",
          action: "ELABORATE",
        },
        room_id: room_id as UUID,
      };

      const result2 = await validate(runtime, message2);

      return result === true && result2 === false;
    });
  }, 60000);

  test("Test repetition check on elaborate", async () => {
    await runAiTest("Test repetition check on elaborate", async () => {
      const message: Message = {
        user_id: zeroUuid as UUID,
        content: {
          content:
            "Hmm, let think for a second, I was going to tell you about something...",
          action: "ELABORATE",
        },
        room_id,
      };

      const handler = action.handler!;

      await populateMemories(runtime, user, room_id, [GetContinueExample1]);

      const result = (await handler(runtime, message)) as Content;

      return result.action !== "ELABORATE";
    });
  }, 60000);

  test("Test multiple elaborate messages in a conversation", async () => {
    await runAiTest(
      "Test multiple elaborate messages in a conversation",
      async () => {
        const message: Message = {
          user_id: user?.id as UUID,
          content: {
            content:
              "Write a short story in three parts, using the ELABORATE action for each part.",
            action: "WAIT",
          },
          room_id: room_id,
        };

        const initialMessageCount = await runtime.messageManager.countMemories(
          room_id,
          false,
        );

        await action.handler!(runtime, message);

        const finalMessageCount = await runtime.messageManager.countMemories(
          room_id,
          false,
        );

        const agentMessages = await runtime.messageManager.getMemories({
          room_id,
          count: finalMessageCount - initialMessageCount,
          unique: false,
        });

        const elaborateMessages = agentMessages.filter(
          (m) =>
            m.user_id === zeroUuid &&
            (m.content as Content).action === "ELABORATE",
        );

        // Check if the agent sent more than one message
        const sentMultipleMessages =
          finalMessageCount - initialMessageCount > 2;

        // Check if the agent used the ELABORATE action for each part
        const usedElaborateAction = elaborateMessages.length === 3;
        // Check if the agent's responses are not empty
        const responsesNotEmpty = agentMessages.every(
          (m) => (m.content as Content).content !== "",
        );

        return sentMultipleMessages && usedElaborateAction && responsesNotEmpty;
      },
    );
  }, 60000);

  test("Test if message is added to database", async () => {
    await runAiTest("Test if message is added to database", async () => {
      const message: Message = {
        user_id: user?.id as UUID,
        content: {
          content: "Tell me more about your favorite food.",
          action: "WAIT",
        },
        room_id: room_id as UUID,
      };

      const initialMessageCount = await runtime.messageManager.countMemories(
        room_id,
        false,
      );

      await action.handler!(runtime, message);

      const finalMessageCount = await runtime.messageManager.countMemories(
        room_id,
        false,
      );

      return finalMessageCount - initialMessageCount === 2;
    });
  }, 60000);
  test("Test if not elaborate", async () => {
    await runAiTest("Test if not elaborate", async () => {
      // this is basically the same test as the one in ignore.test.ts
      const message: Message = {
        user_id: user?.id as UUID,
        content: { content: "Bye" },
        room_id: room_id as UUID,
      };

      const handler = action.handler!;

      await populateMemories(runtime, user, room_id, [Goodbye1]);

      const result = (await handler(runtime, message)) as Content;

      return result.action === "IGNORE";
    });
  }, 60000);

  // test conditions where we would expect a wait or an ignore
});

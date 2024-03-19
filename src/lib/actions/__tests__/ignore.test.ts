import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import {
  GetTellMeAboutYourselfConversationTroll1,
  GetTellMeAboutYourselfConversationTroll2,
  Goodbye1,
} from "../../../test/data";
import { getOrCreateRelationship } from "../../../test/getOrCreateRelationship";
import { populateMemories } from "../../../test/populateMemories";
import { runAiTest } from "../../../test/runAiTest";
import { type User } from "../../../test/types";
import { zeroUuid } from "../../constants";
import { composeContext } from "../../context";
import logger from "../../logger";
import { embeddingZeroVector } from "../../memory";
import { type BgentRuntime } from "../../runtime";
import { messageHandlerTemplate } from "../../templates";
import { Content, State, type Message } from "../../types";
import { parseJSONObjectFromText } from "../../utils";
import action from "../ignore";

async function handleMessage(
  runtime: BgentRuntime,
  message: Message,
  state?: State,
) {
  const _saveRequestMessage = async (message: Message, state: State) => {
    const { content: senderContent, userId, room_id } = message;

    const _senderContent = (
      (senderContent as Content).content ?? senderContent
    )?.trim();
    if (_senderContent) {
      await runtime.messageManager.createMemory({
        user_id: userId!,
        content: {
          content: _senderContent,
          action: (message.content as Content)?.action ?? "null",
        },
        room_id,
        embedding: embeddingZeroVector,
      });
      await runtime.evaluate(message, state);
    }
  };

  await _saveRequestMessage(message, state as State);
  if (!state) {
    state = (await runtime.composeState(message)) as State;
  }

  const context = composeContext({
    state,
    template: messageHandlerTemplate,
  });

  if (runtime.debugMode) {
    logger.log(context, "Response Context", "cyan");
  }

  let responseContent: Content | null = null;
  const { userId, room_id } = message;

  for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
    const response = await runtime.completion({
      context,
      stop: [],
    });

    await runtime.databaseAdapter.log({
      body: { message, context, response },
      user_id: userId,
      room_id,
      type: "ignore_test_completion",
    });

    const parsedResponse = parseJSONObjectFromText(
      response,
    ) as unknown as Content;

    if (
      (parsedResponse.user as string)?.includes(
        (state as State).agentName as string,
      )
    ) {
      responseContent = {
        content: parsedResponse.content,
        action: parsedResponse.action,
      };
      break;
    }
  }

  if (!responseContent) {
    responseContent = {
      content: "",
      action: "IGNORE",
    };
  }

  const _saveResponseMessage = async (
    message: Message,
    state: State,
    responseContent: Content,
  ) => {
    const { room_id } = message;

    responseContent.content = responseContent.content?.trim();

    if (responseContent.content) {
      await runtime.messageManager.createMemory({
        user_id: runtime.agentId,
        content: responseContent,
        room_id,
        embedding: embeddingZeroVector,
      });
      await runtime.evaluate(message, { ...state, responseContent });
    } else {
      console.warn("Empty response, skipping");
    }
  };

  await _saveResponseMessage(message, state, responseContent);
  await runtime.processActions(message, responseContent);

  return responseContent;
}

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

    const data = await getOrCreateRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      throw new Error("Relationship not found");
    }

    room_id = data?.room_id;

    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    await runtime.factManager.removeAllMemoriesByRoomId(room_id);
    await runtime.messageManager.removeAllMemoriesByRoomId(room_id);
  }

  test("Test ignore action", async () => {
    await runAiTest("Test ignore action", async () => {
      const message: Message = {
        userId: user?.id as UUID,
        content: { content: "Never talk to me again", action: "WAIT" },
        room_id: room_id as UUID,
      };

      await populateMemories(runtime, user, room_id, [
        GetTellMeAboutYourselfConversationTroll1,
      ]);

      const result = await handleMessage(runtime, message);

      return result.action === "IGNORE";
    });
  }, 60000);

  test("Action handler test 1: response should be ignore", async () => {
    await runAiTest(
      "Action handler test 1: response should be ignore",
      async () => {
        const message: Message = {
          userId: user.id as UUID,
          content: { content: "", action: "IGNORE" },
          room_id: room_id as UUID,
        };

        await populateMemories(runtime, user, room_id, [
          GetTellMeAboutYourselfConversationTroll1,
        ]);

        await handleMessage(runtime, message);

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
          userId: user.id as UUID,
          content: { content: "", action: "IGNORE" },
          room_id: room_id as UUID,
        };

        await populateMemories(runtime, user, room_id, [
          GetTellMeAboutYourselfConversationTroll2,
        ]);

        await handleMessage(runtime, message);

        const state = await runtime.composeState(message);

        const lastMessage = state.recentMessagesData[0];

        return (lastMessage.content as Content).action === "IGNORE";
      },
    );
  }, 60000);

  test("Expect ignore", async () => {
    await runAiTest("Expect ignore", async () => {
      const message: Message = {
        userId: user.id as UUID,
        content: { content: "Bye", action: "WAIT" },
        room_id: room_id as UUID,
      };

      await populateMemories(runtime, user, room_id, [Goodbye1]);

      await handleMessage(runtime, message);

      const state = await runtime.composeState(message);

      const lastMessage = state.recentMessagesData[0];

      return (lastMessage.content as Content).action === "IGNORE";
    });
  }, 60000);
});

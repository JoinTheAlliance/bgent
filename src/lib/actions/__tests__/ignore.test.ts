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
import { composeContext } from "../../context";
import logger from "../../logger";
import { embeddingZeroVector } from "../../memory";
import { getRelationship } from "../../relationships";
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
    const { content: senderContent, senderId, userIds, room_id } = message;

    const _senderContent = (
      (senderContent as Content).content ?? senderContent
    )?.trim();
    if (_senderContent) {
      await runtime.messageManager.createMemory({
        user_ids: userIds!,
        user_id: senderId!,
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
  const { senderId, room_id, userIds: user_ids, agentId } = message;

  for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
    const response = await runtime.completion({
      context,
      stop: [],
    });

    runtime.supabase
      .from("logs")
      .insert({
        body: { message, context, response },
        user_id: senderId,
        room_id,
        user_ids: user_ids!,
        agent_id: agentId!,
        type: "main_completion",
      })
      .then(({ error }) => {
        if (error) {
          console.error("error", error);
        }
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
    const { agentId, userIds, room_id } = message;

    responseContent.content = responseContent.content?.trim();

    if (responseContent.content) {
      await runtime.messageManager.createMemory({
        user_ids: userIds!,
        user_id: agentId!,
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
          senderId: user.id as UUID,
          agentId: zeroUuid,
          userIds: [user?.id as UUID, zeroUuid],
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
          senderId: user.id as UUID,
          agentId: zeroUuid,
          userIds: [user?.id as UUID, zeroUuid],
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
        senderId: user.id as UUID,
        agentId: zeroUuid,
        userIds: [user?.id as UUID, zeroUuid],
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

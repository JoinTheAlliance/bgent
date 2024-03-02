import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { TEST_ACTION, TEST_ACTION_FAIL } from "../../test/testAction";
import { zeroUuid } from "../constants";
import { createRelationship, getRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { Content, State, type Message } from "../types";
import { runAiTest } from "../../test/runAiTest";
import { composeContext } from "../context";
import logger from "../logger";
import { embeddingZeroVector } from "../memory";
import { messageHandlerTemplate } from "../templates";
import { parseJSONObjectFromText } from "../utils";

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

describe("Actions", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  beforeAll(async () => {
    const { session, runtime: _runtime } = await createRuntime({
      env: process.env as Record<string, string>,
      actions: [TEST_ACTION, TEST_ACTION_FAIL],
    });

    user = session.user!;
    runtime = _runtime;

    // check if the user id exists in the 'accounts' table
    // if it doesn't, create it with the name 'Test User'
    const { data: accounts } = await runtime.supabase
      .from("accounts")
      .select("*")
      .eq("id", user.id as UUID);

    if (accounts && accounts.length === 0) {
      const { error } = await runtime.supabase.from("accounts").insert([
        {
          id: user.id,
          name: "Test User",
          email: user.email,
          avatar_url: "",
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }
    }

    // get all relationships for user
    let data = await getRelationship({
      runtime,
      userA: user.id as UUID,
      userB: "00000000-0000-0000-0000-000000000000" as UUID,
    });

    // if relationship does not exist, create it
    if (!data) {
      await createRelationship({
        runtime,
        userA: user.id as UUID,
        userB: "00000000-0000-0000-0000-000000000000" as UUID,
      });

      data = await getRelationship({
        runtime,
        userA: user.id as UUID,
        userB: "00000000-0000-0000-0000-000000000000" as UUID,
      });
    }

    room_id = data!.room_id;

    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  async function cleanup() {
    await runtime.factManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      "00000000-0000-0000-0000-000000000000" as UUID,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      "00000000-0000-0000-0000-000000000000" as UUID,
    ]);
  }

  // Test that actions are being loaded into context properly
  test("Actions are loaded into context", async () => {
    const actions = runtime.actions;
    expect(actions).toBeDefined();
    expect(actions.length).toBeGreaterThan(0);
    // Ensure the TEST_ACTION action is part of the loaded actions
    const testAction = actions.find((action) => action.name === "TEST_ACTION");
    expect(testAction).toBeDefined();
  });

  // Test that actions are validated properly
  test("Test action is always valid", async () => {
    const testAction = runtime.actions.find(
      (action) => action.name === "TEST_ACTION",
    );
    expect(testAction).toBeDefined();
    if (testAction && testAction.validate) {
      const isValid = await testAction.validate(runtime, {
        agentId: zeroUuid,
        senderId: user.id as UUID,
        userIds: [user.id as UUID, zeroUuid],
        content: { content: "Test message" },
        room_id: room_id,
      });
      expect(isValid).toBeTruthy();
    } else {
      throw new Error(
        "Continue action or its validation function is undefined",
      );
    }
  });

  test("Test that actions are properly validated in state", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: {
        content:
          "Please respond with the message 'ok' and the action TEST_ACTION",
      },
      room_id,
    };

    const state = await runtime.composeState(message);
    expect(state.actionNames).not.toContain("TEST_ACTION_FAIL");

    expect(state.actionNames).toContain("TEST_ACTION");
  });

  // Validate that TEST_ACTION is in the state
  test("Validate that TEST_ACTION is in the state", async () => {
    await runAiTest("Validate TEST_ACTION is in the state", async () => {
      const message: Message = {
        senderId: user.id as UUID,
        agentId: "00000000-0000-0000-0000-000000000000" as UUID,
        userIds: [
          user.id as UUID,
          "00000000-0000-0000-0000-000000000000" as UUID,
        ],
        content: {
          content:
            "Please respond with the message 'ok' and the action TEST_ACTION",
        },
        room_id,
      };

      const response = await handleMessage(runtime, message);
      return response.action === "TEST_ACTION"; // Return true if the expected action matches
    });
  }, 60000);

  // Test that TEST_ACTION action handler is called properly
  test("Test action handler is called", async () => {
    await runAiTest("Test action handler is called", async () => {
      const testAction = runtime.actions.find(
        (action) => action.name === "TEST_ACTION",
      );
      if (!testAction || !testAction.handler) {
        console.error("Continue action or its handler function is undefined");
        return false; // Return false to indicate the test setup failed
      }

      const mockMessage: Message = {
        agentId: "00000000-0000-0000-0000-000000000000" as UUID,
        senderId: user.id as UUID,
        userIds: [
          user.id as UUID,
          "00000000-0000-0000-0000-000000000000" as UUID,
        ],
        content: {
          content: "Test message for TEST action",
        },
        room_id,
      };

      const response = await testAction.handler(runtime, mockMessage);
      return response !== undefined; // Return true if the handler returns a defined response
    });
  }, 60000); // You can adjust the timeout if needed
});

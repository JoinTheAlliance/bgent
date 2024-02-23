import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { TEST_ACTION, TEST_ACTION_FAIL } from "../../test/testAction";
import { getRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { type Message } from "../types";

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
    const { session, runtime: _runtime } = await createRuntime({
      env: process.env as Record<string, string>,
      actions: [TEST_ACTION, TEST_ACTION_FAIL],
    });
    user = session.user;
    runtime = _runtime;

    const data = await getRelationship({
      runtime,
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

  // Test that actions are being loaded into context properly
  test("Actions are loaded into context", async () => {
    const actions = runtime.actions;
    expect(actions).toBeDefined();
    expect(actions.length).toBeGreaterThan(0);
    // Ensure the CONTINUE action is part of the loaded actions
    const continueAction = actions.find((action) => action.name === "CONTINUE");
    expect(continueAction).toBeDefined();
  });

  // Test that actions are validated properly
  test("Continue action is always valid", async () => {
    const continueAction = runtime.actions.find(
      (action) => action.name === "CONTINUE",
    );
    expect(continueAction).toBeDefined();
    if (continueAction && continueAction.validate) {
      const isValid = await continueAction.validate(runtime, {
        agentId: zeroUuid,
        senderId: user.id as UUID,
        userIds: [user.id as UUID, zeroUuid],
        content: "Test message",
        room_id: room_id,
      });
      expect(isValid).toBeTruthy();
    } else {
      throw new Error(
        "Continue action or its validation function is undefined",
      );
    }
  });

  test("Validate that TEST_ACTION is in the state", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content:
        "Please respond with the message 'ok' and the action TEST_ACTION",
      room_id,
    };

    const response = await runtime.handleMessage(message);

    expect(response.action).toEqual("TEST_ACTION");
  });

  test("Test that actions are properly validated in state", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content:
        "Please respond with the message 'ok' and the action TEST_ACTION",
      room_id,
    };

    const state = await runtime.composeState(message);
    expect(state.actionNames).not.toContain("TEST_ACTION_FAIL");

    expect(state.actionNames).toContain("TEST_ACTION");
  });

  // Test that action handlers are being called properly
  test("Continue action handler is called", async () => {
    const continueAction = runtime.actions.find(
      (action) => action.name === "CONTINUE",
    );
    expect(continueAction).toBeDefined();
    if (continueAction && continueAction.handler) {
      const mockMessage = {
        agentId: zeroUuid,
        senderId: user.id as UUID,
        userIds: [user.id as UUID, zeroUuid],
        content: "Test message for CONTINUE action",
        room_id: room_id,
      };
      const response = await continueAction.handler(runtime, mockMessage);
      expect(response).toBeDefined();
      // Further assertions can be made based on the expected outcome of the CONTINUE action handler
    } else {
      throw new Error("Continue action or its handler function is undefined");
    }
  }, 20000);
});

import { User } from "@supabase/supabase-js";
import { UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import testEvaluator from "../../test/testEvaluator";
import { getRelationship } from "../relationships";
import { BgentRuntime } from "../runtime";
import { Message } from "../types";

dotenv.config();

describe("Evaluation Process", () => {
  let runtime: BgentRuntime;
  let user: User;
  let room_id: UUID;
  const zeroUuid: UUID = "00000000-0000-0000-0000-000000000000";

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      evaluators: [testEvaluator],
    });
    runtime = setup.runtime;
    user = setup.session.user;

    const relationship = await getRelationship({
      runtime,
      userA: user.id as UUID,
      userB: zeroUuid,
    });
    room_id = relationship?.room_id;
  });

  test("Custom evaluator is loaded into state", async () => {
    // const state = await runtime.composeState({
    //   agentId: zeroUuid,
    //   senderId: user.id as UUID,
    //   userIds: [user?.id as UUID, zeroUuid],
    //   content: "Test message",
    //   room_id,
    // });
    // expect(state.evaluators).toContain(testEvaluator.name);
  });

  test("Validate the format of the examples from the evaluator", () => {
    expect(testEvaluator.examples).toBeInstanceOf(Array);
    testEvaluator.examples.forEach((example) => {
      expect(example).toHaveProperty("context");
      expect(example).toHaveProperty("messages");
      expect(example.messages).toBeInstanceOf(Array);
      example.messages.forEach((message) => {
        expect(message).toHaveProperty("user");
        expect(message).toHaveProperty("content");
        expect(message).toHaveProperty("action");
      });
      expect(example).toHaveProperty("outcome");
    });
  });

  test("Check if test and examples appear in prompt", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Test message for evaluation",
      room_id,
    };

    const response = await runtime.handleRequest(message);
    expect(response).toContain("TEST_EVALUATOR");
    expect(response).toContain(testEvaluator.examples[0].outcome);
  });

  test("Create prompt to call TEST_EVALUATOR action and validate response", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Trigger TEST_EVALUATOR",
      room_id,
    };

    const response = await runtime.handleRequest(message);
    expect(response.action).toEqual("TEST_EVALUATOR");
  });

  test("Run the TEST_EVALUATOR handler and validate output", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Run TEST_EVALUATOR handler",
      room_id,
    };

    const result = await testEvaluator.handler(runtime, message);
    expect(result).toBeTruthy();
  });
});

import { User } from "@supabase/supabase-js";
import { UUID } from "crypto";
import dotenv from "dotenv";
import { composeContext } from "../context";
import { evaluationTemplate } from "../evaluation";
import { createRuntime } from "../../test/createRuntime";
import { TEST_EVALUATOR, TEST_EVALUATOR_FAIL } from "../../test/testEvaluator";
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
      evaluators: [TEST_EVALUATOR, TEST_EVALUATOR_FAIL],
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
    expect(TEST_EVALUATOR.examples).toBeInstanceOf(Array);
    TEST_EVALUATOR.examples.forEach((example) => {
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

  test("Check if test and examples appear in state", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Test message for evaluation",
      room_id,
    };

    const state = await runtime.composeState(message);
    const prompt = composeContext({ state, template: evaluationTemplate });

    // expect that the prompt contacts the testEvaluator name
    expect(prompt).toContain(TEST_EVALUATOR.name);

    // check if state.EvaluatorNames contains the testEvaluator name

    expect(state.evaluatorNames).toContain(TEST_EVALUATOR.name);
  });


  test("Run the TEST_EVALUATOR handler and validate output", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Run TEST_EVALUATOR handler",
      room_id,
    };

    const result = await TEST_EVALUATOR.handler(runtime, message);
    expect(result).toBeTruthy();
  });
});

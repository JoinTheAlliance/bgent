import { type User } from "@supabase/supabase-js";
import { BgentRuntime } from "../runtime";
import { type Message } from "../types";
import { createRuntime } from "../../test/createRuntime";
import { type UUID } from "crypto";

describe("Evaluation Process", () => {
  let runtime: BgentRuntime;
  let user: User;
  const zeroUuid = "00000000-0000-0000-0000-000000000000";

  beforeAll(async () => {
    const setup = await createRuntime();
    runtime = setup.runtime;
    user = setup.session.user;

    // Assuming the evaluator 'summary' is already registered in the runtime setup
  });

  test("Evaluation Injection - Evaluator Creates Memory", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "Trigger evaluator content",
      room_id: zeroUuid,
    };

    await runtime.handleRequest(message);

    // Assuming the 'summary' evaluator tags the memories it creates with 'summarization'
    const memories = await runtime.summarizationManager.getMemoriesByIds({
      userIds: [user.id as UUID, zeroUuid],
      count: 1,
    });

    // Expect at least one memory to be created with the 'summarization' tag
    expect(memories.length).toBeGreaterThan(0);
  });

  test("Evaluator Not Running if No Evaluation Handlers are True", async () => {
    const message: Message = {
      senderId: user?.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      content: "Non-triggering content",
      room_id: zeroUuid,
    };

    await runtime.handleRequest(message);

    // Assuming the 'summary' evaluator tags the memories it creates with 'summarization'
    const memories = await runtime.summarizationManager.getMemoriesByIds({
      userIds: [user.id as UUID, zeroUuid],
      count: 10,
    });

    // Assuming the previous test ran and created exactly one memory
    // Expect the number of memories to remain unchanged
    expect(memories.length).toBe(1);
  });

  test("Evaluation Handling and Response - Evaluator Updates Memory", async () => {
    const message: Message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Content that leads to a specific evaluator response",
      room_id: zeroUuid,
    };

    await runtime.handleRequest(message);

    // Assuming the 'summary' evaluator updates the 'content' of memories it processes
    // Fetch the updated memory
    const memories = await runtime.summarizationManager.getMemoriesByIds({
      userIds: [user.id as UUID, zeroUuid],
      count: 1,
    });

    // Expect the updated memory to contain specific content
    expect(memories[0].content).toContain("specific content");
  });
});

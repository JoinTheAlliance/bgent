import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { composeContext } from "../context";
import { addLore, getLore } from "../lore";
import { BgentRuntime } from "../runtime";
import { requestHandlerTemplate } from "../templates";
import { type Content } from "../types";

dotenv.config({ path: ".dev.vars" });
describe("Lore", () => {
  const zeroUuid: UUID = "00000000-0000-0000-0000-000000000000";
  let runtime: BgentRuntime;
  let user: User;

  beforeAll(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = result.runtime;
    user = result?.session?.user as User;
  });

  beforeEach(async () => {
    await runtime.loreManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  });

  afterAll(async () => {
    await runtime.loreManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  });

  test("Add and get lore", async () => {
    const content: Content = { content: "Test", source: "/Test.md" };
    await addLore({
      runtime,
      source: "/Test.md",
      content: { content: "Test" },
      user_id: zeroUuid,
      room_id: zeroUuid,
    });

    const lore = await getLore({
      runtime,
      message: "Test",
    });

    expect(lore[0].content).toEqual(content);
  }, 60000);

  // TODO: Test that the lore is in the context of the agent

  test("Test that lore is in the context of the agent", async () => {
    await addLore({
      runtime,
      source: "Test Lore Source",
      content: { content: "Test Lore Content" },
      user_id: zeroUuid as UUID,
      room_id: zeroUuid,
    });

    const message = {
      senderId: zeroUuid as UUID,
      agentId: zeroUuid,
      userIds: [zeroUuid],
      content: { content: "Test Lore Content" },
      room_id: zeroUuid,
    };

    const state = await runtime.composeState(message);

    const context = composeContext({
      state,
      template: requestHandlerTemplate,
    });

    // expect context to contain 'Test Lore Source' and 'Test Lore Content'
    expect(context).toContain("Test Lore Source");
    expect(context).toContain("Test Lore Content");
  }, 60000);
});

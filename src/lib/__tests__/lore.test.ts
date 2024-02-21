import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { MemoryManager } from "../memory";
import { getRelationship } from "../relationships";
import { type Content, type Memory } from "../types";
import { getCachedEmbedding, writeCachedEmbedding } from "../../test/cache";
import { BgentRuntime } from "../runtime";
import { addLore, getLore } from "../lore";
import { composeContext } from "../context";
import { requestHandlerTemplate } from "../templates";

dotenv.config();
describe("Lore", () => {
  const zeroUuid: UUID = "00000000-0000-0000-0000-000000000000";
  let runtime: BgentRuntime;
  let user: User;
  let room_id: UUID;

  beforeAll(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = result.runtime;
    user = result.session.user;

    const data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;
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
      content: "Test",
      user_id: user.id as UUID,
      room_id,
    });

    const lore = await getLore({
      runtime,
      message: "Test",
    });

    expect(lore).toHaveLength(1);
    expect(lore[0].content).toEqual(content);
  });

  // TODO: Test that the lore is in the context of the agent

  test("Test that lore is in the context of the agent", async () => {
    await addLore({
      runtime,
      source: "Test Lore Source",
      content: "Test Lore Content",
      user_id: user.id as UUID,
      room_id,
    });

    const message = {
      senderId: user.id as UUID,
      agentId: zeroUuid,
      userIds: [user.id as UUID, zeroUuid],
      content: "Test",
      room_id,
    };

    const state = await runtime.composeState(message);

    // expect state.lore to exist
    expect(state.lore).toHaveLength(1);

    const context = composeContext({
      state,
      template: requestHandlerTemplate,
    });

    // expect context to contain 'Test Lore Source' and 'Test Lore Content'
    expect(context).toContain("Test Lore Source");
    expect(context).toContain("Test Lore Content");
  });
});

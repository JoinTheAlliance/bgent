import { type User } from "../../test/types";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { composeContext } from "../context";
import { addLore, getLore } from "../lore";
import { BgentRuntime } from "../runtime";
import { messageHandlerTemplate } from "../templates";
import { type Content } from "../types";
import { zeroUuid } from "../constants";
import { getRelationship } from "../relationships";

dotenv.config({ path: ".dev.vars" });
describe("Lore", () => {
  let runtime: BgentRuntime;
  let room_id: UUID;

  beforeAll(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = result.runtime;
    const user = result?.session?.user as User;
    const data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      throw new Error("Relationship not found");
    }

    room_id = data?.room_id;
  });

  beforeEach(async () => {
    await runtime.loreManager.removeAllMemoriesByRoomId(room_id);
  });

  afterAll(async () => {
    await runtime.loreManager.removeAllMemoriesByRoomId(room_id);
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
      userId: zeroUuid as UUID,
      content: { content: "Test Lore Content" },
      room_id: zeroUuid,
    };

    const state = await runtime.composeState(message);

    const context = composeContext({
      state,
      template: messageHandlerTemplate,
    });

    // expect context to contain 'Test Lore Source' and 'Test Lore Content'
    expect(context).toContain("Test Lore Source");
    expect(context).toContain("Test Lore Content");
  }, 60000);
});

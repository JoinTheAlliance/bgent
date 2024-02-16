import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { getRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { populateMemories } from "../../test/populateMemories";

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
    const setup = await createRuntime();
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      supabase: runtime.supabase,
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

  // TODO: 1. Test that actions are being loaded into context properly

  // TODO: 2. Test that actions are validated properply, for example we know that the continue action is always valid

  // TODO 3. Test that action handlers are being called properly
});

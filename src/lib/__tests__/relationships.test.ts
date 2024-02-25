import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime"; // Adjust the import path as needed
import {
  createRelationship,
  getRelationship,
  getRelationships,
} from "../relationships"; // Adjust the import path as needed
import { BgentRuntime } from "../runtime";
import { zeroUuid } from "../constants";

dotenv.config({ path: ".dev.vars" });

describe("Relationships Module", () => {
  let runtime: BgentRuntime;
  let user: User;

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = setup.runtime;
    user = setup.session.user;
  });

  test("createRelationship creates a new relationship", async () => {
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    const relationship = await createRelationship({
      runtime,
      userA,
      userB,
    });

    expect(relationship).toBe(true);
  });

  test("getRelationship retrieves an existing relationship", async () => {
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    await createRelationship({ runtime, userA, userB });

    const relationship = await getRelationship({
      runtime,
      userA,
      userB,
    });
    expect(relationship).toBeDefined();
    expect(relationship.user_a).toBe(userA);
    expect(relationship.user_b).toBe(userB);
  });

  test("getRelationships retrieves all relationships for a user", async () => {
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    await createRelationship({ runtime, userA, userB });

    const relationships = await getRelationships({
      runtime,
      userId: userA,
    });
    expect(relationships).toBeDefined();
    expect(relationships.length).toBeGreaterThan(0);
    expect(
      relationships.some((r) => r.user_a === userA || r.user_b === userA),
    ).toBeTruthy();
  });
});

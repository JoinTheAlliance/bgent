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

dotenv.config();

const zeroUuid = "00000000-0000-0000-0000-000000000000";

describe("Relationships Module", () => {
  let runtime: BgentRuntime;
  let user: User;

  beforeAll(async () => {
    const setup = await createRuntime();
    runtime = setup.runtime;
    user = setup.session.user;
  });

  test("createRelationship creates a new relationship", async () => {
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    const relationship = await createRelationship({
      supabase: runtime.supabase,
      userA,
      userB,
    });

    expect(relationship).toBe(true);
  });

  test("getRelationship retrieves an existing relationship", async () => {
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    await createRelationship({ supabase: runtime.supabase, userA, userB });

    const relationship = await getRelationship({
      supabase: runtime.supabase,
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

    await createRelationship({ supabase: runtime.supabase, userA, userB });

    const relationships = await getRelationships({
      supabase: runtime.supabase,
      userId: userA,
    });
    expect(relationships).toBeDefined();
    expect(relationships.length).toBeGreaterThan(0);
    expect(
      relationships.some((r) => r.user_a === userA || r.user_b === userA),
    ).toBeTruthy();
  });

  //   test('formatRelationships formats relationships correctly', async () => {
  //     const userA = uuidv4();
  //     const userB = uuidv4();
  //     const userC = uuidv4();

  //     await createRelationship({ supabase, userA, userB });
  //     await createRelationship({ supabase, userA, userC });

  //     const formattedRelationships = await formatRelationships({ supabase, userId: userA });
  //     expect(formattedRelationships).toBeDefined();
  //     expect(formattedRelationships.length).toBeGreaterThan(0);
  //     expect(formattedRelationships).toContain(userB);
  //     expect(formattedRelationships).toContain(userC);
  //   });
});

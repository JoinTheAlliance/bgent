import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { getOrCreateRelationship } from "../../test/getOrCreateRelationship";
import { type User } from "../../test/types";
import { zeroUuid } from "../constants";
import { formatFacts } from "../evaluators/fact";
import { formatActors, formatMessages, getActorDetails } from "../messages";
import { createRelationship } from "../relationships";
import { type BgentRuntime } from "../runtime";
import { type Actor, type Content, type Memory } from "../types";

dotenv.config({ path: ".dev.vars" });

describe("Messages Library", () => {
  let runtime: BgentRuntime, user: User, actors: Actor[];

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = setup.runtime;
    user = setup.session.user;
    actors = await getActorDetails({
      runtime,
      room_id: "00000000-0000-0000-0000-000000000000",
    });
  });

  test("getActorDetails should return actors based on given room_id", async () => {
    // create a room and add a user to it
    const userA = user?.id as UUID;
    const userB = zeroUuid;

    await createRelationship({
      runtime,
      userA,
      userB,
    });

    const relationship = await getOrCreateRelationship({
      runtime,
      userA,
      userB,
    });

    if (!relationship?.room_id) {
      throw new Error("Room not found");
    }

    const result = await getActorDetails({
      runtime,
      room_id: relationship?.room_id as UUID,
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((actor: Actor) => {
      expect(actor).toHaveProperty("name");
      expect(actor).toHaveProperty("details");
      expect(actor).toHaveProperty("id");
    });
  });

  test("formatActors should format actors into a readable string", () => {
    const formattedActors = formatActors({ actors });
    actors.forEach((actor) => {
      expect(formattedActors).toContain(actor.name);
    });
  });

  test("formatMessages should format messages into a readable string", async () => {
    const messages: Memory[] = [
      {
        content: { content: "Hello" },
        user_id: user.id as UUID,
        room_id: "00000000-0000-0000-0000-000000000000",
      },
      {
        content: { content: "How are you?" },
        user_id: "00000000-0000-0000-0000-000000000000",
        room_id: "00000000-0000-0000-0000-000000000000",
      },
    ];
    const formattedMessages = formatMessages({ messages, actors });
    messages.forEach((message: Memory) => {
      expect(formattedMessages).toContain((message.content as Content).content);
    });
  });

  test("formatFacts should format facts into a readable string", async () => {
    const facts: Memory[] = [
      {
        content: { content: "Reflecting on the day" },
        user_id: user.id as UUID,
        room_id: "00000000-0000-0000-0000-000000000000",
      },
      {
        content: { content: "Thoughts and musings" },
        user_id: "00000000-0000-0000-0000-000000000000",
        room_id: "00000000-0000-0000-0000-000000000000room",
      },
    ];
    const formattedFacts = formatFacts(facts);
    facts.forEach((fact) => {
      expect(formattedFacts).toContain(fact.content.content);
    });
  });
});

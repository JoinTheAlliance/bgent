import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { createRuntime } from "../../test/createRuntime";
import {
  formatMessageActors,
  formatMessages,
  formatReflections,
  getMessageActors,
  getRandomMessageExamples,
} from "../messages";
import { type BgentRuntime } from "../runtime";
import { type Content, type Actor, type Memory } from "../types";

describe("Messages Library", () => {
  let runtime: BgentRuntime, user: User, actors: Actor[];

  beforeAll(async () => {
    const setup = await createRuntime(process.env as Record<string, string>);
    runtime = setup.runtime;
    user = setup.user as User;
    actors = await getMessageActors({
      supabase: runtime.supabase,
      userIds: [user.id as UUID, "00000000-0000-0000-0000-000000000000"],
    });
  });

  test("getMessageActors should return actors based on given userIds", async () => {
    const result = await getMessageActors({
      supabase: runtime.supabase,
      userIds: [user.id as UUID, "00000000-0000-0000-0000-000000000000"],
    });
    expect(result.length).toBeGreaterThan(0);
    result.forEach((actor) => {
      expect(actor).toHaveProperty("name");
      expect(actor).toHaveProperty("details");
      expect(actor).toHaveProperty("id");
    });
  });

  test("formatMessageActors should format actors into a readable string", () => {
    const formattedActors = formatMessageActors({ actors });
    actors.forEach((actor) => {
      expect(formattedActors).toContain(actor.name);
    });
  });
  

  test("getRandomMessageExamples should return a specified number of random message examples", () => {
    const examples = getRandomMessageExamples(3);
    console.log("*** examples", examples);
    expect(examples.split("\n\n").length).toBe(3);
  });

  test("formatMessages should format messages into a readable string", async () => {
    const messages: Memory[] = [
      {
        content: "Hello",
        user_id: user.id as UUID,
        user_ids: [user.id as UUID],
        room_id: "00000000-0000-0000-0000-000000000000",
      },
      {
        content: "How are you?",
        user_id: "00000000-0000-0000-0000-000000000000",
        user_ids: [user.id as UUID],
        room_id: "00000000-0000-0000-0000-000000000000",
      },
    ];
    const formattedMessages = formatMessages({ messages, actors });
    messages.forEach((message: Memory) => {
      console.log("message", message);
      expect(formattedMessages).toContain(
        (message.content as Content).content || (message.content as string),
      );
    });
  });

  test("formatReflections should format reflections into a readable string", async () => {
    const reflections: Memory[] = [
      {
        content: "Reflecting on the day",
        user_id: user.id as UUID,
        user_ids: [user.id as UUID],
        room_id: "00000000-0000-0000-0000-000000000000",
      },
      {
        content: "Thoughts and musings",
        user_id: "00000000-0000-0000-0000-000000000000",
        user_ids: [user.id as UUID],
        room_id: "00000000-0000-0000-0000-000000000000room",
      },
    ];
    const formattedReflections = formatReflections(reflections);
    reflections.forEach((reflection) => {
      expect(formattedReflections).toContain(reflection.content);
    });
  });
});

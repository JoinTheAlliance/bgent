import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { createRuntime } from "../../test/createRuntime";
import {
  formatMessageActors,
  formatMessages,
  getMessageActors,
} from "../messages";
import { type BgentRuntime } from "../runtime";
import { type Actor, type Content, type Memory } from "../types";
import { formatSummarizations } from "../evaluators/summarization";

describe("Messages Library", () => {
  let runtime: BgentRuntime, user: User, actors: Actor[];

  beforeAll(async () => {
    const setup = await createRuntime();
    runtime = setup.runtime;
    user = setup.session.user;
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

  test("formatSummarizations should format summarizations into a readable string", async () => {
    const summarizations: Memory[] = [
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
    const formattedSummarizations = formatSummarizations(summarizations);
    summarizations.forEach((summarization) => {
      expect(formattedSummarizations).toContain(summarization.content);
    });
  });
});

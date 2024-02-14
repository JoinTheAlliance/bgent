import { type Actor, type Content, type Memory } from "./types";
import { messageExamples } from "./messageExamples";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";

export async function getMessageActors({
  supabase,
  userIds,
}: {
  supabase: SupabaseClient;
  userIds: UUID[];
}) {
  const response = await supabase
    .from("accounts")
    .select("*")
    .in("id", userIds);
  if (response.error) {
    console.error(response.error);
    return [];
  }

  const { data } = response;

  const actors = data.map((actor: Actor) => {
    const { name, details, id } = actor;
    return {
      name,
      details,
      id,
    };
  });

  return actors as Actor[];
}

export function formatMessageActors({ actors }: { actors: Actor[] }) {
  const actorStrings = actors.map((actor: Actor) => {
    const header = `${actor.name}: ${actor.details.tagline}\n${actor.details.summary}`;
    return header;
  });
  const finalActorStrings = actorStrings.join("\n");
  return finalActorStrings;
}

export const getRandomMessageExamples = (count: number) => {
  const examples: Array<
    Array<
      | { user: string; content: string; action: null | undefined }
      | { user: string; content: string; action: string }
    >
  > = [];
  while (examples.length < count && examples.length < messageExamples.length) {
    const randomIndex = Math.floor(Math.random() * messageExamples.length);
    const randomExample = messageExamples[randomIndex];
    if (!examples.includes(randomExample)) {
      examples.push(randomExample);
    }
  }

  const formattedExamples = examples.map((example) => {
    return `\n${example
      .map((message) => {
        return JSON.stringify(message);
      })
      .join("\n")}`;
  });

  return formattedExamples.join("\n");
};

export const formatMessages = ({
  messages,
  actors,
}: {
  messages: Memory[];
  actors: Actor[];
}) => {
  const messageStrings = messages
    .reverse()
    .filter((message: Memory) => message.user_id)
    .map((message: Memory) => {
      const sender = actors.find(
        (actor: Actor) => actor.id === message.user_id,
      )!;
      return `{ "user": "${sender.name}", "content": "${(message.content as Content).content || (message.content as string)}", ${(message.content as Content).action ? `"action": "${(message.content as Content).action}"` : ""} }`;
    })
    .join("\n");
  return messageStrings;
};

export const formatReflections = (reflections: Memory[]) => {
  const messageStrings = reflections
    .reverse()
    .map(
      (reflection: Memory) =>
        `${(reflection.content as Content)?.content ?? (reflection.content as string)}`,
    );
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

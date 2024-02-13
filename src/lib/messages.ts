import { type Actor, type Content, type Memory } from "./types";
import { messageExamples } from "./messageExamples";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";

/** Get the actors who are participating in the message, for context injection of name and description
 * agents is the array of default agents to search from
 * userIds are UUIDs of users, stored in DB
 */
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

  // join the data from the database with the data from the exampleNpcs
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
  // format actors as a string
  const actorStrings = actors.map((actor: Actor) => {
    const header = `${actor.name}: ${actor.details.tagline}\n${actor.details.summary}`;
    return header;
  });
  const finalActorStrings = actorStrings.join("\n");
  return finalActorStrings;
}

/** get random conversation examples
 * return an array of random conversation examples from the messageExamples array
 */
export const getRandomMessageExamples = (count: number) => {
  // return an array of random conversation examples from the messageExamples array
  const examples: Array<
    Array<
      | { user: string; content: string; action: null | undefined }
      | { user: string; content: string; action: string }
    >
  > = [];
  // make sure the examples are not duplicated
  while (examples.length < count && examples.length < messageExamples.length) {
    const randomIndex = Math.floor(Math.random() * messageExamples.length);
    const randomExample = messageExamples[randomIndex];
    if (!examples.includes(randomExample)) {
      examples.push(randomExample);
    }
  }

  // exampe messages is an array of arrays of objects
  // format the examples so that each object is on one line
  const formattedExamples = examples.map((example) => {
    return `\n${example
      .map((message) => {
        return JSON.stringify(message);
      })
      .join("\n")}`;
  });

  return formattedExamples.join("\n");
};

// format conversation as string
export const formatMessages = ({
  messages,
  actors,
}: {
  messages: Memory[];
  actors: Actor[];
}) => {
  // format conversation as a string
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

/** format conversation as string */
export const formatReflections = (reflections: Memory[]) => {
  // format conversation as a string
  const messageStrings = reflections
    .reverse()
    .map(
      (reflection: Memory) =>
        `${(reflection.content as Content)?.content ?? (reflection.content as string)}`,
    );
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

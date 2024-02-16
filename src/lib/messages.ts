import { type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { type Actor, type Content, type Memory } from "./types";

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
    const header = `${actor.name}${actor.details.tagline ? ": " + actor.details.tagline : ""}\n${actor.details.summary || "No information available"}`;
    return header;
  });
  const finalActorStrings = actorStrings.join("\n");
  return finalActorStrings;
}

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
      return `${sender.name}: ${(message.content as Content).content || (message.content as string)} ${(message.content as Content).action && (message.content as Content).action !== "null" ? `(${(message.content as Content).action})` : ""}`;
    })
    .join("\n");
  return messageStrings;
};

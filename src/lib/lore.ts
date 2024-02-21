import { UUID } from "crypto";
import { zeroUuid } from "./constants";
import { type BgentRuntime } from "./runtime";
import { Content, Memory } from "./types";

export async function addLore({
  runtime,
  source,
  content,
  embedContent,
  user_id = zeroUuid,
  room_id = zeroUuid,
}: {
  runtime: BgentRuntime;
  source: string;
  content: string;
  embedContent?: string;
  user_id?: UUID;
  room_id?: UUID;
}) {
  const loreManager = runtime.loreManager;

  const embedding = embedContent
    ? await runtime.embed(embedContent)
    : await runtime.embed(content);

  await loreManager.createMemory({
    user_id,
    user_ids: [user_id],
    content: { content, source },
    room_id,
    embedding: embedding,
  });
}

export async function getLore({
  runtime,
  message,
  match_threshold,
  count,
}: {
  runtime: BgentRuntime;
  message: string;
  match_threshold?: number;
  count?: number;
}) {
  const loreManager = runtime.loreManager;
  const embedding = await runtime.embed(message);
  const lore = await loreManager.searchMemoriesByEmbedding(embedding, {
    userIds: [zeroUuid],
    match_threshold,
    count,
  });
  return lore;
}

export const formatLore = (lore: Memory[]) => {
  const messageStrings = lore.reverse().map((fragment: Memory) => {
    const content = fragment.content as Content;
    return `${content.content}\n${content.source ? " (Source: " + content.source + ")" : ""}`;
  });
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

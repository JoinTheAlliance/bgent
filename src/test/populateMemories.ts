import { type UUID } from "crypto";
import { type User } from "./types";
import { type BgentRuntime } from "../lib/runtime";
import { Content } from "../lib/types";
import { getCachedEmbedding, writeCachedEmbedding } from "./cache";

export async function populateMemories(
  runtime: BgentRuntime,
  user: User,
  room_id: UUID,
  conversations: Array<
    (user_id: UUID) => Array<{ user_id: UUID; content: Content }>
  >,
) {
  for (const conversation of conversations) {
    for (const c of conversation(user?.id as UUID)) {
      const existingEmbedding = getCachedEmbedding(c.content.content);
      const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
        user_id: c.user_id as UUID,
        content: {
          content: c.content.content,
          action: c.content.action as string,
        },
        room_id: room_id as UUID,
        embedding: existingEmbedding,
      });
      await runtime.messageManager.createMemory(bakedMemory);
      if (!existingEmbedding) {
        writeCachedEmbedding(
          c.content.content,
          bakedMemory.embedding as number[],
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
}

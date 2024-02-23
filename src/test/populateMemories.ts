import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { zeroUuid } from "../lib/actions/__tests__/ignore.test";
import { type BgentRuntime } from "../lib/runtime";
import { getCachedEmbedding, writeCachedEmbedding } from "./cache";
import { ActionExample } from "../lib/types";

export async function populateMemories(
  runtime: BgentRuntime,
  user: User,
  room_id: UUID,
  conversations: Array<
    (user_id: UUID) => Array<{ user_id: UUID; content: string }>
  >,
) {
  for (const conversation of conversations) {
    for (const c of conversation(user?.id as UUID)) {
      const existingEmbedding = getCachedEmbedding(c.content);
      const bakedMemory = await runtime.messageManager.addEmbeddingToMemory({
        user_id: c.user_id as UUID,
        user_ids: [user?.id as UUID, zeroUuid],
        content: {
          content: c.content,
          action: (c as unknown as ActionExample).action as string,
        },
        room_id: room_id as UUID,
        embedding: existingEmbedding,
      });
      await runtime.messageManager.createMemory(bakedMemory);
      if (!existingEmbedding) {
        writeCachedEmbedding(c.content, bakedMemory.embedding as number[]);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
}

import { type UUID } from "crypto";
import { type BgentRuntime } from "./runtime";
import { type Memory } from "./types";

export const embeddingDimension = 3072;
export const embeddingZeroVector = Array(embeddingDimension).fill(0);

const defaultMatchThreshold = 0.1;
const defaultMatchCount = 10;

interface SearchOptions {
  match_threshold?: number;
  count?: number;
  userIds: UUID[];
  unique?: boolean;
}

export class MemoryManager {
  runtime: BgentRuntime;
  tableName: string;
  constructor({
    tableName,
    runtime,
  }: {
    tableName: string;
    runtime: BgentRuntime;
  }) {
    this.runtime = runtime;
    this.tableName = tableName;
  }

  async addEmbeddingToMemory(memory: Memory): Promise<Memory> {
    if (memory.embedding) {
      return memory;
    }
    const getMemoryEmbeddingString = (memory: Memory) => {
      if (typeof memory.content === "string") {
        return memory.content;
      }
      if (typeof memory.content === "object" && memory.content !== null) {
        return JSON.stringify(memory.content.content ?? memory.content);
      }
      return "";
    };

    const memoryText = getMemoryEmbeddingString(memory);
    memory.embedding = memoryText
      ? await this.runtime.embed(memoryText)
      : embeddingZeroVector.slice();
    return memory;
  }

  async getMemoriesByIds({
    userIds,
    count,
    unique = true,
  }: {
    userIds: UUID[];
    count: number;
    unique?: boolean;
  }): Promise<Memory[]> {
    const result = await this.runtime.supabase.rpc("get_memories", {
      query_table_name: this.tableName,
      query_user_ids: userIds,
      query_count: count,
      query_unique: !!unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    if (!result.data) {
      console.warn("data was null, no memories found for", {
        userIds,
        count,
      });
      return [];
    }
    return result.data;
  }

  async searchMemoriesByEmbedding(
    embedding: number[],
    opts: SearchOptions,
  ): Promise<Memory[]> {
    const {
      match_threshold = defaultMatchThreshold,
      count = defaultMatchCount,
      userIds = [],
      unique,
    } = opts;

    const result = await this.runtime.supabase.rpc("search_memories", {
      query_table_name: this.tableName,
      query_user_ids: userIds,
      query_embedding: embedding, // Pass the embedding you want to compare
      query_match_threshold: match_threshold, // Choose an appropriate threshold for your data
      query_match_count: count, // Choose the number of matches
      query_unique: !!unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }

    return result.data;
  }

  async createMemory(memory: Memory, unique = false): Promise<void> {
    if (unique) {
      const result = await this.runtime.supabase.rpc(
        "check_similarity_and_insert",
        {
          query_table_name: this.tableName,
          query_user_id: memory.user_id,
          query_user_ids: memory.user_ids,
          query_content: memory.content,
          query_room_id: memory.room_id,
          query_embedding: memory.embedding,
          similarity_threshold: 0.95,
        },
      );

      if (result.error) {
        throw new Error(JSON.stringify(result.error));
      }
    } else {
      const result = await this.runtime.supabase
        .from(this.tableName)
        .insert(memory);
      const { error } = result;
      if (error) {
        throw new Error(JSON.stringify(error));
      }
    }
  }

  async removeMemory(memoryId: UUID): Promise<void> {
    const result = await this.runtime.supabase
      .from(this.tableName)
      .delete()
      .eq("id", memoryId);
    const { error } = result;
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async removeAllMemoriesByUserIds(userIds: UUID[]): Promise<void> {
    const result = await this.runtime.supabase.rpc("remove_memories", {
      query_table_name: this.tableName,
      query_user_ids: userIds,
    });

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
  }

  async countMemoriesByUserIds(
    userIds: UUID[],
    unique = true,
  ): Promise<number> {
    const query = {
      query_table_name: this.tableName,
      query_user_ids: userIds,
      query_unique: !!unique,
    };
    const result = await this.runtime.supabase.rpc("count_memories", query);

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }

    return result.data;
  }
}

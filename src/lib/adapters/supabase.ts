// File: /src/lib/database/SupabaseDatabaseAdapter.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import {
  type Memory,
  type Goal,
  type Relationship,
  Actor,
  GoalStatus,
  Account,
  SimilaritySearch,
} from "../types";
import { DatabaseAdapter } from "../database";

export class SupabaseDatabaseAdapter extends DatabaseAdapter {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getAccountById(userId: UUID): Promise<Account | null> {
    const { data, error } = await this.supabase
      .from("accounts")
      .select("*")
      .eq("id", userId);
    if (error) {
      throw new Error(error.message);
    }
    return (data?.[0] as Account) || null;
  }

  async createAccount(account: Account): Promise<void> {
    const { error } = await this.supabase.from("accounts").insert([account]);
    if (error) {
      throw new Error(error.message);
    }
  }

  async getActorDetails(params: { userIds: UUID[] }): Promise<Actor[]> {
    const response = await this.supabase
      .from("accounts")
      .select("*")
      .in("id", params.userIds);
    if (response.error) {
      console.error(response.error);
      return [];
    }
    const { data } = response;
    return data.map((actor: Actor) => ({
      name: actor.name,
      details: actor.details,
      id: actor.id,
    }));
  }

  async searchMemories(params: {
    tableName: string;
    userIds: UUID[];
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    console.log(
      "searching memories",
      params.tableName,
      params.embedding.length,
    );
    const result = await this.supabase.rpc("search_memories", {
      query_table_name: params.tableName,
      query_user_ids: params.userIds,
      query_embedding: params.embedding,
      query_match_threshold: params.match_threshold,
      query_match_count: params.match_count,
      query_unique: params.unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    return result.data;
  }

  async getMemoryByContent(opts: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<SimilaritySearch[]> {
    console.log("get_memory_by_content", opts);
    const result = await this.supabase.rpc("get_embedding_list", opts);
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    return result.data;
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    await this.supabase
      .from("goals")
      .update({ status: params.status })
      .match({ id: params.goalId });
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    user_ids: UUID[];
    agent_id: UUID;
    type: string;
  }): Promise<void> {
    const { error } = await this.supabase.from("logs").insert({
      body: params.body,
      user_id: params.user_id,
      room_id: params.room_id,
      user_ids: params.user_ids,
      agent_id: params.agent_id,
      type: params.type,
    });

    if (error) {
      console.error("Error inserting log:", error);
      throw new Error(error.message);
    }
  }

  async getMemoriesByIds(params: {
    userIds: UUID[];
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    const result = await this.supabase.rpc("get_memories", {
      query_table_name: params.tableName,
      query_user_ids: params.userIds,
      query_count: params.count,
      query_unique: !!params.unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    if (!result.data) {
      console.warn("data was null, no memories found for", {
        userIds: params.userIds,
        count: params.count,
      });
      return [];
    }
    return result.data;
  }

  async searchMemoriesByEmbedding(
    embedding: number[],
    params: {
      match_threshold?: number;
      count?: number;
      userIds?: UUID[];
      unique?: boolean;
      tableName: string;
    },
  ): Promise<Memory[]> {
    const result = await this.supabase.rpc("search_memories", {
      query_table_name: params.tableName,
      query_user_ids: params.userIds,
      query_embedding: embedding,
      query_match_threshold: params.match_threshold,
      query_match_count: params.count,
      query_unique: !!params.unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    return result.data;
  }

  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    if (unique) {
      const opts = {
        query_table_name: tableName,
        query_user_id: memory.user_id,
        query_user_ids: memory.user_ids,
        query_content: memory.content.content,
        query_room_id: memory.room_id,
        query_embedding: memory.embedding,
        similarity_threshold: 0.95,
      };

      const result = await this.supabase.rpc(
        "check_similarity_and_insert",
        opts,
      );

      if (result.error) {
        throw new Error(JSON.stringify(result.error));
      }
    } else {
      const result = await this.supabase.from(tableName).insert(memory);
      const { error } = result;
      if (error) {
        throw new Error(JSON.stringify(error));
      }
    }
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    const result = await this.supabase
      .from(tableName)
      .delete()
      .eq("id", memoryId);
    const { error } = result;
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async removeAllMemoriesByUserIds(
    userIds: UUID[],
    tableName: string,
  ): Promise<void> {
    const result = await this.supabase.rpc("remove_memories", {
      query_table_name: tableName,
      query_user_ids: userIds,
    });

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
  }

  async countMemoriesByUserIds(
    userIds: UUID[],
    unique = true,
    tableName: string,
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }
    const query = {
      query_table_name: tableName,
      query_user_ids: userIds,
      query_unique: !!unique,
    };
    const result = await this.supabase.rpc("count_memories", query);

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }

    return result.data;
  }

  async getGoals(params: {
    userIds: UUID[];
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    const opts = {
      query_user_ids: params.userIds,
      query_user_id: params.userId,
      only_in_progress: params.onlyInProgress,
      row_count: params.count,
    };
    const { data: goals, error } = await this.supabase.rpc(
      "get_goals_by_user_ids",
      opts,
    );

    if (error) {
      throw new Error(error.message);
    }

    return goals;
  }

  async updateGoal(goal: Goal): Promise<void> {
    await this.supabase.from("goals").update(goal).match({ id: goal.id });
  }

  async createGoal(goal: Goal): Promise<void> {
    await this.supabase.from("goals").upsert(goal);
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    const { error } = await this.supabase.from("relationships").upsert({
      user_a: params.userA,
      user_b: params.userB,
      user_id: params.userA,
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    const { data, error } = await this.supabase.rpc("get_relationship", {
      usera: params.userA,
      userb: params.userB,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data[0];
  }

  async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
    const { data, error } = await this.supabase
      .from("relationships")
      .select("*")
      .or(`user_a.eq.${params.userId},user_b.eq.${params.userId}`)
      .eq("status", "FRIENDS");

    if (error) {
      throw new Error(error.message);
    }

    return data as Relationship[];
  }
}

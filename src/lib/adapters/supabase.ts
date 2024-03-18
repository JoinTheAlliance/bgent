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

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    const response = await this.supabase
      .from("rooms")
      .select(
        `
        participants:participants!inner(
          user_id:accounts(id, name, details)
        )
      `,
      )
      .eq("id", params.room_id);

    if (response.error) {
      console.error(response.error);
      return [];
    }

    const { data } = response;

    return data
      .map((room) =>
        room.participants.map((participant) => {
          const user = participant.user_id[0]; // Assuming user_id is an array with a single object
          return {
            name: user?.name,
            details: user?.details,
            id: user?.id,
          };
        }),
      )
      .flat();
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    const result = await this.supabase.rpc("search_memories", {
      query_table_name: params.tableName,
      query_room_id: params.room_id,
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
    type: string;
  }): Promise<void> {
    const { error } = await this.supabase.from("logs").insert({
      body: params.body,
      user_id: params.user_id,
      room_id: params.room_id,
      type: params.type,
    });

    if (error) {
      console.error("Error inserting log:", error);
      throw new Error(error.message);
    }
  }

  async getMemoriesByRoomId(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    const result = await this.supabase.rpc("get_memories", {
      query_table_name: params.tableName,
      query_room_id: params.room_id,
      query_count: params.count,
      query_unique: !!params.unique,
    });
    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
    if (!result.data) {
      console.warn("data was null, no memories found for", {
        room_id: params.room_id,
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
      room_id?: UUID;
      unique?: boolean;
      tableName: string;
    },
  ): Promise<Memory[]> {
    const result = await this.supabase.rpc("search_memories", {
      query_table_name: params.tableName,
      query_room_id: params.room_id,
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
      const result = await this.supabase
        .from("memories")
        .insert({ ...memory, type: tableName });
      const { error } = result;
      if (error) {
        throw new Error(JSON.stringify(error));
      }
    }
  }

  async removeMemory(memoryId: UUID): Promise<void> {
    const result = await this.supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);
    const { error } = result;
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async removeAllMemoriesByRoomId(
    room_id: UUID,
    tableName: string,
  ): Promise<void> {
    const result = await this.supabase.rpc("remove_memories", {
      query_table_name: tableName,
      query_room_id: room_id,
    });

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
  }

  async countMemoriesByRoomId(
    room_id: UUID,
    unique = true,
    tableName: string,
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }
    const query = {
      query_table_name: tableName,
      query_room_id: room_id,
      query_unique: !!unique,
    };
    const result = await this.supabase.rpc("count_memories", query);

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }

    return result.data;
  }

  async getGoals(params: {
    room_id: UUID;
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    const opts = {
      query_room_id: params.room_id,
      query_user_id: params.userId,
      only_in_progress: params.onlyInProgress,
      row_count: params.count,
    };

    const { data: goals, error } = await this.supabase.rpc("get_goals", opts);

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
    const { data, error: roomsError } = (await this.supabase
      .from("rooms")
      .insert({ name: "test relationship" })
      .single()) as { data: { id: UUID } | null; error: Error | null };
    if (roomsError) {
      throw new Error(roomsError.message);
    }
    const room_id = data?.id;
    const { error: participantsError } = await this.supabase
      .from("participants")
      .insert([
        { user_id: params.userA, room_id },
        { user_id: params.userB, room_id },
      ]);
    if (participantsError) {
      throw new Error(participantsError.message);
    }
    // then create a relationship between the two users with the room_id as the relationship's room_id

    const { error } = await this.supabase.from("relationships").upsert({
      user_a: params.userA,
      user_b: params.userB,
      user_id: params.userA,
      room_id,
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

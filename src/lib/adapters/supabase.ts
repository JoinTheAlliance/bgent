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
} from "../types";
import { DatabaseAdapter } from "../database";

export class SupabaseDatabaseAdapter extends DatabaseAdapter {
  supabase: SupabaseClient;

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
    // TODO: change to insert and run tests
    const { error } = await this.supabase.from("accounts").upsert([account]);
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
          account:accounts(id, name, details)
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
          const user = participant.account as unknown as Actor;
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

  async getCachedEmbeddings(opts: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<
    {
      embedding: number[];
      levenshtein_score: number;
    }[]
  > {
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

  async getMemories(params: {
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

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    const result = await this.supabase.rpc("remove_memories", {
      query_table_name: tableName,
      query_room_id: room_id,
    });

    if (result.error) {
      throw new Error(JSON.stringify(result.error));
    }
  }

  async countMemories(
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
    const { error } = await this.supabase
      .from("goals")
      .update(goal)
      .match({ id: goal.id });
    if (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  }

  async createGoal(goal: Goal): Promise<void> {
    const { error } = await this.supabase.from("goals").insert(goal);
    if (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  }

  async removeGoal(goalId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("goals")
      .delete()
      .eq("id", goalId);
    if (error) {
      throw new Error(`Error removing goal: ${error.message}`);
    }
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("goals")
      .delete()
      .eq("room_id", room_id);
    if (error) {
      throw new Error(`Error removing goals: ${error.message}`);
    }
  }

  async getRoomsByParticipant(userId: UUID): Promise<UUID[]> {
    const { data, error } = await this.supabase
      .from("participants")
      .select("room_id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error getting rooms by participant: ${error.message}`);
    }

    return data.map((row) => row.room_id as UUID);
  }

  async getRoomsByParticipants(userIds: UUID[]): Promise<UUID[]> {
    const { data, error } = await this.supabase
      .from("participants")
      .select("room_id")
      .in("user_id", userIds);

    if (error) {
      throw new Error(`Error getting rooms by participants: ${error.message}`);
    }

    return [...new Set(data.map((row) => row.room_id as UUID))];
  }

  async createRoom(name: string): Promise<UUID> {
    const { data, error } = (await this.supabase
      .from("rooms")
      .upsert({ name })
      .single()) as { data: { id: UUID } | null; error: Error | null };

    if (error) {
      throw new Error(`Error creating room: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from room creation");
    }

    return data.id;
  }

  async removeRoom(roomId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);

    if (error) {
      throw new Error(`Error removing room: ${error.message}`);
    }
  }

  async addParticipantToRoom(userId: UUID, roomId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("participants")
      .insert({ user_id: userId, room_id: roomId });

    if (error) {
      throw new Error(`Error adding participant: ${error.message}`);
    }
  }

  async removeParticipantFromRoom(userId: UUID, roomId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("participants")
      .delete()
      .eq("user_id", userId)
      .eq("room_id", roomId);

    if (error) {
      throw new Error(`Error removing participant: ${error.message}`);
    }
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    // check for room with values name: `Room for ${params.userA} and ${params.userB}`, created_by: params.userA,
    const { data: allRoomData, error: allRoomsError } = await this.supabase
      .from("rooms")
      .select("id")
      .eq("name", `Room for ${params.userA} and ${params.userB}`)
      .eq("created_by", params.userA);

    if (allRoomsError) {
      throw new Error("All rooms error: " + allRoomsError.message);
    }

    if (!allRoomData || allRoomData.length === 0) {
      const { error: roomsError } = await this.supabase
        .from("rooms")
        .insert({
          name: `Room for ${params.userA} and ${params.userB}`,
          created_by: params.userA,
        })
        .eq("name", `Room for ${params.userA} and ${params.userB}`);

      if (roomsError) {
        throw new Error("Room error: " + roomsError.message);
      }
    }

    // get the room_id from the room creation
    const { data, error: roomError } = await this.supabase
      .from("rooms")
      .select("id")
      .eq("name", `Room for ${params.userA} and ${params.userB}`)
      .single();

    if (roomError) {
      throw new Error("Room error: " + roomError.message);
    }

    const room_id = data.id as UUID;
    if (!room_id) {
      throw new Error("Room not found");
    }
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

    const { error } = await this.supabase
      .from("relationships")
      .upsert({
        user_a: params.userA,
        user_b: params.userB,
        user_id: params.userA,
        status: "FRIENDS",
      })
      .eq("user_a", params.userA)
      .eq("user_b", params.userB);

    if (error) {
      throw new Error("Relationship error: " + error.message);
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

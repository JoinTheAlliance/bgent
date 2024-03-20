import { type UUID } from "crypto";
import {
  Account,
  Actor,
  GoalStatus,
  type Goal,
  type Memory,
  type Relationship,
} from "./types";

export abstract class DatabaseAdapter {
  abstract getAccountById(userId: UUID): Promise<Account | null>;

  abstract createAccount(account: Account): Promise<void>;

  abstract getMemories(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]>;

  abstract getCachedEmbeddings({
    query_table_name,
    query_threshold,
    query_input,
    query_field_name,
    query_field_sub_name,
    query_match_count,
  }: {
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
  >;

  abstract log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void>;

  abstract getActorDetails(params: { room_id: UUID }): Promise<Actor[]>;

  abstract searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]>;

  abstract updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void>;

  abstract searchMemoriesByEmbedding(
    embedding: number[],
    params: {
      match_threshold?: number;
      count?: number;
      room_id?: UUID;
      unique?: boolean;
      tableName: string;
    },
  ): Promise<Memory[]>;

  abstract createMemory(
    memory: Memory,
    tableName: string,
    unique?: boolean,
  ): Promise<void>;

  abstract removeMemory(memoryId: UUID, tableName: string): Promise<void>;

  abstract removeAllMemories(room_id: UUID, tableName: string): Promise<void>;

  abstract countMemories(
    room_id: UUID,
    unique?: boolean,
    tableName?: string,
  ): Promise<number>;

  abstract getGoals(params: {
    room_id: UUID;
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]>;

  abstract updateGoal(goal: Goal): Promise<void>;

  abstract createGoal(goal: Goal): Promise<void>;

  abstract removeGoal(goalId: UUID): Promise<void>;

  abstract removeAllGoals(room_id: UUID): Promise<void>;

  abstract createRoom(name: string): Promise<UUID>;

  abstract removeRoom(roomId: UUID): Promise<void>;

  abstract getRoomsByParticipant(userId: UUID): Promise<UUID[]>;

  abstract getRoomsByParticipants(userIds: UUID[]): Promise<UUID[]>;

  abstract addParticipantToRoom(userId: UUID, roomId: UUID): Promise<void>;

  abstract removeParticipantFromRoom(userId: UUID, roomId: UUID): Promise<void>;

  abstract createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean>;

  abstract getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null>;

  abstract getRelationships(params: { userId: UUID }): Promise<Relationship[]>;
}

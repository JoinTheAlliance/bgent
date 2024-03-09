import { type UUID } from "crypto";
import {
  type Memory,
  type Goal,
  type Relationship,
  Actor,
  GoalStatus,
  Account,
} from "./types";

export abstract class DatabaseAdapter {
  abstract getAccountById(userId: UUID): Promise<Account | null>;
  abstract createAccount(account: Account): Promise<void>;

  abstract getMemoriesByIds(params: {
    userIds: UUID[];
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]>;

  abstract log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    user_ids: UUID[];
    agent_id: UUID;
    type: string;
  }): Promise<void>;

  abstract getActorDetails(params: { userIds: UUID[] }): Promise<Actor[]>;

  abstract searchMemories(params: {
    tableName: string;
    userIds: UUID[];
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
      userIds?: UUID[];
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

  abstract removeAllMemoriesByUserIds(
    userIds: UUID[],
    tableName: string,
  ): Promise<void>;

  abstract countMemoriesByUserIds(
    userIds: UUID[],
    unique?: boolean,
    tableName?: string,
  ): Promise<number>;

  abstract getGoals(params: {
    userIds: UUID[];
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]>;

  abstract updateGoal(goal: Goal): Promise<void>;

  abstract createGoal(goal: Goal): Promise<void>;

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

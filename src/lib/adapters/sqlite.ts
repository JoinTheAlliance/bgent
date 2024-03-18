// File: /src/lib/database/SqliteDatabaseAdapter.ts
import { type UUID } from "crypto";
import { DatabaseAdapter } from "../database";
import {
  Actor,
  GoalStatus,
  type Goal,
  type Memory,
  type Relationship,
  Account,
} from "../types";

import { Database } from "better-sqlite3";
import * as sqlite_vss from "sqlite-vss";

export class SqliteDatabaseAdapter extends DatabaseAdapter {
  private db: Database;

  constructor(db: Database) {
    super();
    this.db = db;
    sqlite_vss.load(this.db);
  }

  async getAccountById(userId: UUID): Promise<Account | null> {
    const sql = "SELECT * FROM accounts WHERE id = ?";
    return (this.db.prepare(sql).get(userId) as Account) || null;
  }

  async createAccount(account: Account): Promise<void> {
    const sql =
      "INSERT INTO accounts (id, name, email, avatar_url, details) VALUES (?, ?, ?, ?, ?)";
    this.db
      .prepare(sql)
      .run(
        account.id,
        account.name,
        account.email,
        account.avatar_url,
        JSON.stringify(account.details),
      );
  }

  async getActorDetails(params: { userIds: UUID[] }): Promise<Actor[]> {
    const sql = "SELECT * FROM accounts WHERE id IN (?)";
    return this.db.prepare(sql).all(params.userIds) as Actor[];
  }

  async searchMemories(params: {
    tableName: string;
    userIds: UUID[];
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    let sql = `
      SELECT *
      FROM ${params.tableName}
      WHERE user_ids @> ? AND vss_search(embedding, ?)
      ORDER BY vss_search(embedding, ?) DESC
      LIMIT ?
    `;
    const queryParams = [
      JSON.stringify(params.userIds),
      JSON.stringify(params.embedding),
      JSON.stringify(params.embedding),
      params.match_count,
    ];

    if (params.unique) {
      sql += " AND unique = 1";
    }

    return this.db.prepare(sql).all(...queryParams) as Memory[];
  }

  async getMemoryByContent(opts: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<[]> {
    const sql = `
      SELECT *
      FROM ${opts.query_table_name}
      WHERE vss_search(${opts.query_field_name}, ?)
      ORDER BY vss_search(${opts.query_field_name}, ?) DESC
      LIMIT ?
    `;
    return this.db
      .prepare(sql)
      .all(
        JSON.stringify(opts.query_input),
        JSON.stringify(opts.query_input),
        opts.query_match_count,
      ) as [];
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    const sql = "UPDATE goals SET status = ? WHERE id = ?";
    this.db.prepare(sql).run(params.status, params.goalId);
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    user_ids: UUID[];
    agent_id: UUID;
    type: string;
  }): Promise<void> {
    const sql =
      "INSERT INTO logs (body, user_id, room_id, user_ids, agent_id, type) VALUES (?, ?, ?, ?, ?, ?)";
    this.db
      .prepare(sql)
      .run(
        JSON.stringify(params.body),
        params.user_id,
        params.room_id,
        JSON.stringify(params.user_ids),
        params.agent_id,
        params.type,
      );
  }

  async getMemoriesByIds(params: {
    userIds: UUID[];
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    let sql = `SELECT * FROM ${params.tableName} WHERE user_ids @> ?`;
    const queryParams = [JSON.stringify(params.userIds)];

    if (params.unique) {
      sql += " AND unique = 1";
    }

    if (params.count) {
      sql += " LIMIT ?";
      queryParams.push(params.count.toString());
    }

    return this.db.prepare(sql).all(...queryParams) as Memory[];
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
    let sql = `
      SELECT *
      FROM ${params.tableName}
      WHERE vss_search(embedding, ?)
      ORDER BY vss_search(embedding, ?) DESC
    `;
    const queryParams = [JSON.stringify(embedding), JSON.stringify(embedding)];

    if (params.userIds) {
      sql += " AND user_ids @> ?";
      queryParams.push(JSON.stringify(params.userIds));
    }

    if (params.unique) {
      sql += " AND unique = 1";
    }

    if (params.count) {
      sql += " LIMIT ?";
      queryParams.push(params.count.toString());
    }

    return this.db.prepare(sql).all(...queryParams) as Memory[];
  }

  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    const sql = `INSERT INTO ${tableName} (id, created_at, content, embedding, user_id, user_ids, room_id, unique) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    this.db
      .prepare(sql)
      .run(
        memory.id,
        memory.created_at,
        JSON.stringify(memory.content),
        JSON.stringify(memory.embedding),
        memory.user_id,
        JSON.stringify(memory.user_ids),
        memory.room_id,
        unique ? 1 : 0,
      );
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    this.db.prepare(sql).run(memoryId);
  }

  async removeAllMemoriesByUserIds(
    userIds: UUID[],
    tableName: string,
  ): Promise<void> {
    const sql = `DELETE FROM ${tableName} WHERE user_ids @> ?`;
    this.db.prepare(sql).run(JSON.stringify(userIds));
  }

  async countMemoriesByUserIds(
    userIds: UUID[],
    unique = true,
    tableName = "",
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }

    let sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE user_ids @> ?`;
    const queryParams = [JSON.stringify(userIds)] as string[];

    if (unique) {
      sql += " AND unique = 1";
    }

    return (this.db.prepare(sql).get(...queryParams) as { count: number })
      .count;
  }

  async getGoals(params: {
    userIds: UUID[];
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    let sql = "SELECT * FROM goals WHERE user_ids @> ?";
    const queryParams = [JSON.stringify(params.userIds)];

    if (params.userId) {
      sql += " AND user_id = ?";
      queryParams.push(params.userId);
    }

    if (params.onlyInProgress) {
      sql += " AND status = 'IN_PROGRESS'";
    }

    if (params.count) {
      sql += " LIMIT ?";
      queryParams.push(params.count.toString());
    }

    return this.db.prepare(sql).all(...queryParams) as Goal[];
  }

  async updateGoal(goal: Goal): Promise<void> {
    const sql =
      "UPDATE goals SET name = ?, status = ?, objectives = ? WHERE id = ?";
    this.db
      .prepare(sql)
      .run(goal.name, goal.status, JSON.stringify(goal.objectives), goal.id);
  }

  async createGoal(goal: Goal): Promise<void> {
    const sql =
      "INSERT INTO goals (id, user_ids, user_id, name, status, objectives) VALUES (?, ?, ?, ?, ?, ?)";
    this.db
      .prepare(sql)
      .run(
        goal.id,
        JSON.stringify(goal.user_ids),
        goal.user_id,
        goal.name,
        goal.status,
        JSON.stringify(goal.objectives),
      );
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    const sql =
      "INSERT INTO relationships (user_a, user_b, user_id) VALUES (?, ?, ?)";
    this.db.prepare(sql).run(params.userA, params.userB, params.userA);
    return true;
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    const sql =
      "SELECT * FROM relationships WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)";
    return (
      (this.db
        .prepare(sql)
        .get(
          params.userA,
          params.userB,
          params.userB,
          params.userA,
        ) as Relationship) || null
    );
  }

  async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
    const sql =
      "SELECT * FROM relationships WHERE (user_a = ? OR user_b = ?) AND status = 'FRIENDS'";
    return this.db
      .prepare(sql)
      .all(params.userId, params.userId) as Relationship[];
  }
}

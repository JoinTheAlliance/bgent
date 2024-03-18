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
import { load } from "./sqlite/sqlite_vss";
import { sqliteTables } from "./sqlite/sqliteTables";

export class SqliteDatabaseAdapter extends DatabaseAdapter {
  private db: Database;

  constructor(db: Database) {
    super();
    this.db = db;
    load(this.db);
    // sqliteTables is a string of SQL commands
    this.db.exec(sqliteTables);
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

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    const sql = "SELECT * FROM accounts WHERE id IN (?)";
    return this.db.prepare(sql).all(params.room_id) as Actor[];
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    let sql = `
      SELECT *
      FROM memories
      WHERE type = ${params.tableName} AND room_id = ? AND vss_search(embedding, ?)
      ORDER BY vss_search(embedding, ?) DESC
      LIMIT ?
    `;
    const queryParams = [
      JSON.stringify(params.room_id),
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
      FROM memories
      WHERE type = ?
      AND vss_search(${opts.query_field_name}, ?)
      ORDER BY vss_search(${opts.query_field_name}, ?) DESC
      LIMIT ?
    `;
    return this.db
      .prepare(sql)
      .all(
        JSON.stringify(opts.query_table_name),
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
    type: string;
  }): Promise<void> {
    const sql =
      "INSERT INTO logs (body, user_id, room_id, type) VALUES (?, ?, ?, ?)";
    this.db
      .prepare(sql)
      .run(
        JSON.stringify(params.body),
        params.user_id,
        params.room_id,
        params.type,
      );
  }

  async getMemoriesByRoomId(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    if (!params.tableName) {
      throw new Error("tableName is required");
    }
    if (!params.room_id) {
      throw new Error("room_id is required");
    }
    let sql = `SELECT * FROM memories WHERE type = ${params.tableName} AND room_id = ${params.room_id}`;

    if (params.unique) {
      sql += " AND unique = 1";
    }

    if (params.count) {
      sql += ` LIMIT ${params.count}`;
    }

    return this.db.prepare(sql).all() as Memory[];
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
    let sql = `
      SELECT *
      FROM memories
      WHERE type = ${params.tableName} AND vss_search(embedding, ?)
      ORDER BY vss_search(embedding, ?) DESC
    `;
    const queryParams = [JSON.stringify(embedding), JSON.stringify(embedding)];

    if (params.room_id) {
      sql += " AND room_id = ?";
      queryParams.push(JSON.stringify(params.room_id));
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
    const sql = `INSERT INTO memories (id, type, created_at, content, embedding, user_id, room_id, \`unique\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    this.db
      .prepare(sql)
      .run(
        memory.id,
        tableName,
        memory.created_at,
        JSON.stringify(memory.content),
        JSON.stringify(memory.embedding),
        memory.user_id,
        memory.room_id,
        unique ? 1 : 0,
      );
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    const sql = `DELETE FROM memories WHERE type = ? AND id = ?`;
    this.db.prepare(sql).run(tableName, memoryId);
  }

  async removeAllMemoriesByRoomId(
    room_id: UUID,
    tableName: string,
  ): Promise<void> {
    const sql = `DELETE FROM memories WHERE type = ? AND room_id = ?`;
    this.db.prepare(sql).run(tableName, JSON.stringify(room_id));
  }

  async countMemoriesByRoomId(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }

    let sql = `SELECT COUNT(*) as count FROM memories WHERE type = ? AND room_id = ?`;
    const queryParams = [tableName, JSON.stringify(room_id)] as string[];

    if (unique) {
      sql += " AND unique = 1";
    }

    return (this.db.prepare(sql).get(...queryParams) as { count: number })
      .count;
  }

  async getGoals(params: {
    room_id: UUID;
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    let sql = "SELECT * FROM goals WHERE room_id = ?";
    const queryParams = [JSON.stringify(params.room_id)];

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
      "INSERT INTO goals (id, room_id, user_id, name, status, objectives) VALUES (?, ?, ?, ?, ?, ?)";
    this.db
      .prepare(sql)
      .run(
        goal.id,
        JSON.stringify(goal.room_id),
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

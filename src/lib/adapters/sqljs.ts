// File: /src/lib/database/SqlJsDatabaseAdapter.ts
import crypto, { type UUID } from "crypto";
import { DatabaseAdapter } from "../database";
import {
  Account,
  Actor,
  GoalStatus,
  type Goal,
  type Memory,
  type Relationship,
} from "../types";
import { sqliteTables } from "./sqlite/sqliteTables";
import { Database } from "./sqljs/types";

export class SqlJsDatabaseAdapter extends DatabaseAdapter {
  db: Database;

  constructor(db: Database) {
    super();
    this.db = db;

    // Check if the 'accounts' table exists as a representative table
    const tableExists = this.db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'",
    )[0];

    if (!tableExists) {
      // If the 'accounts' table doesn't exist, create all the tables
      this.db.exec(sqliteTables);
    }
  }

  async getAccountById(userId: UUID): Promise<Account | null> {
    const sql = "SELECT * FROM accounts WHERE id = ?";
    const stmt = this.db.prepare(sql);
    stmt.bind([userId]);
    const account = stmt.getAsObject() as unknown as Account | undefined;

    if (account && typeof account.details === "string") {
      account.details = JSON.parse(account.details);
    }

    stmt.free();
    return account || null;
  }

  async createAccount(account: Account): Promise<void> {
    const sql = `
      INSERT INTO accounts (id, name, email, avatar_url, details)
      VALUES (?, ?, ?, ?, ?)
    `;
    const stmt = this.db.prepare(sql);
    stmt.run([
      account.id ?? crypto.randomUUID(),
      account.name,
      account.email || "",
      account.avatar_url || "",
      JSON.stringify(account.details),
    ]);
    stmt.free();
  }

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    const sql = `
      SELECT a.id, a.name, a.details
      FROM participants p
      LEFT JOIN accounts a ON p.user_id = a.id
      WHERE p.room_id = ?
    `;
    const stmt = this.db.prepare(sql);
    stmt.bind([params.room_id]);
    const rows: Actor[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as Actor;
      rows.push({
        ...row,
        details:
          typeof row.details === "string"
            ? JSON.parse(row.details)
            : row.details,
      });
    }
    stmt.free();
    return rows;
  }

  async createMemory(memory: Memory, tableName: string): Promise<void> {
    let isUnique = true;
    if (memory.embedding) {
      // Check if a similar memory already exists
      const similarMemories = await this.searchMemoriesByEmbedding(
        memory.embedding,
        {
          tableName,
          room_id: memory.room_id,
          match_threshold: 0.95, // 5% similarity threshold
          count: 1,
        },
      );

      isUnique = similarMemories.length === 0;
    }

    // Insert the memory with the appropriate 'unique' value
    const sql = `INSERT INTO memories (id, type, content, embedding, user_id, room_id, \`unique\`) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const stmt = this.db.prepare(sql);
    stmt.run([
      crypto.randomUUID(),
      tableName,
      JSON.stringify(memory.content),
      JSON.stringify(memory.embedding),
      memory.user_id,
      memory.room_id,
      isUnique ? 1 : 0,
    ]);
    stmt.free();
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    let sql =
      `
  SELECT *` +
      // TODO: Uncomment when we compile sql.js with vss
      // `, (1 - vss_distance_l2(embedding, ?)) AS similarity` +
      ` FROM memories
  WHERE type = ?
  AND room_id = ?`;

    if (params.unique) {
      sql += " AND `unique` = 1";
    }
    // TODO: Uncomment when we compile sql.js with vss
    // sql += ` ORDER BY similarity DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    stmt.bind([
      // JSON.stringify(params.embedding),
      params.tableName,
      params.room_id,
      // params.match_count,
    ]);
    const memories: (Memory & { similarity: number })[] = [];
    while (stmt.step()) {
      const memory = stmt.getAsObject() as unknown as Memory & {
        similarity: number;
      };
      memories.push({
        ...memory,
        content: JSON.parse(memory.content as unknown as string),
      });
    }
    stmt.free();
    return memories;
  }

  async searchMemoriesByEmbedding(
    _embedding: number[],
    params: {
      match_threshold?: number;
      count?: number;
      room_id?: UUID;
      unique?: boolean;
      tableName: string;
    },
  ): Promise<Memory[]> {
    let sql =
      `SELECT *` +
      // TODO: Uncomment when we compile sql.js with vss
      // `, (1 - vss_distance_l2(embedding, ?)) AS similarity`+
      ` FROM memories
        WHERE type = ?`;

    if (params.unique) {
      sql += " AND `unique` = 1";
    }
    if (params.room_id) {
      sql += " AND room_id = ?";
    }
    // TODO: Uncomment when we compile sql.js with vss
    // sql += ` ORDER BY similarity DESC`;

    if (params.count) {
      sql += " LIMIT ?";
    }

    const stmt = this.db.prepare(sql);
    const bindings = [
      // JSON.stringify(embedding),
      params.tableName,
    ];
    if (params.room_id) {
      bindings.push(params.room_id);
    }
    if (params.count) {
      bindings.push(params.count.toString());
    }

    stmt.bind(bindings);
    const memories: (Memory & { similarity: number })[] = [];
    while (stmt.step()) {
      const memory = stmt.getAsObject() as unknown as Memory & {
        similarity: number;
      };
      memories.push({
        ...memory,
        content: JSON.parse(memory.content as unknown as string),
      });
    }
    stmt.free();
    return memories;
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
    const sql =
      `
        SELECT *
        FROM memories
        WHERE type = ?` +
      // `AND vss_search(${opts.query_field_name}, ?)
      // ORDER BY vss_search(${opts.query_field_name}, ?) DESC` +
      ` LIMIT ?
      `;
    const stmt = this.db.prepare(sql);
    stmt.bind([
      opts.query_table_name,
      // opts.query_input,
      // opts.query_input,
      opts.query_match_count,
    ]);
    const memories: Memory[] = [];
    while (stmt.step()) {
      const memory = stmt.getAsObject() as unknown as Memory;
      memories.push(memory);
    }
    stmt.free();

    return memories.map((memory) => ({
      embedding: JSON.parse(memory.embedding as unknown as string),
      levenshtein_score: 0,
    }));
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    const sql = "UPDATE goals SET status = ? WHERE id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([params.status, params.goalId]);
    stmt.free();
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void> {
    const sql =
      "INSERT INTO logs (body, user_id, room_id, type) VALUES (?, ?, ?, ?)";
    const stmt = this.db.prepare(sql);
    stmt.run([
      JSON.stringify(params.body),
      params.user_id,
      params.room_id,
      params.type,
    ]);
    stmt.free();
  }

  async getMemories(params: {
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
    let sql = `SELECT * FROM memories WHERE type = ? AND room_id = ?`;

    if (params.unique) {
      sql += " AND `unique` = 1";
    }

    sql += " ORDER BY created_at DESC";

    if (params.count) {
      sql += " LIMIT ?";
    }

    const stmt = this.db.prepare(sql);
    const bindings: (string | number)[] = [params.tableName, params.room_id];
    if (params.count) {
      bindings.push(params.count.toString());
    }

    stmt.bind(bindings);
    const memories: Memory[] = [];
    while (stmt.step()) {
      const memory = stmt.getAsObject() as unknown as Memory;
      memories.push({
        ...memory,
        content: JSON.parse(memory.content as unknown as string),
      });
    }
    stmt.free();
    return memories;
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    const sql = `DELETE FROM memories WHERE type = ? AND id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run([tableName, memoryId]);
    stmt.free();
  }

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    const sql = `DELETE FROM memories WHERE type = ? AND room_id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run([tableName, room_id]);
    stmt.free();
  }

  async countMemories(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }

    let sql = `SELECT COUNT(*) as count FROM memories WHERE type = ? AND room_id = ?`;
    if (unique) {
      sql += " AND `unique` = 1";
    }

    const stmt = this.db.prepare(sql);
    stmt.bind([tableName, room_id]);

    let count = 0;
    if (stmt.step()) {
      const result = stmt.getAsObject() as { count: number };
      count = result.count;
    }

    stmt.free();
    return count;
  }

  async getGoals(params: {
    room_id: UUID;
    userId?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    let sql = "SELECT * FROM goals WHERE room_id = ?";
    const bindings: (string | number)[] = [params.room_id];

    if (params.userId) {
      sql += " AND user_id = ?";
      bindings.push(params.userId);
    }

    if (params.onlyInProgress) {
      sql += " AND status = 'IN_PROGRESS'";
    }

    if (params.count) {
      sql += " LIMIT ?";
      bindings.push(params.count.toString());
    }

    const stmt = this.db.prepare(sql);
    stmt.bind(bindings);
    const goals: Goal[] = [];
    while (stmt.step()) {
      const goal = stmt.getAsObject() as unknown as Goal;
      goals.push({
        ...goal,
        objectives:
          typeof goal.objectives === "string"
            ? JSON.parse(goal.objectives)
            : goal.objectives,
      });
    }
    stmt.free();
    return goals;
  }

  async updateGoal(goal: Goal): Promise<void> {
    const sql =
      "UPDATE goals SET name = ?, status = ?, objectives = ? WHERE id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([
      goal.name,
      goal.status,
      JSON.stringify(goal.objectives),
      goal.id as string,
    ]);
    stmt.free();
  }

  async createGoal(goal: Goal): Promise<void> {
    const sql =
      "INSERT INTO goals (id, room_id, user_id, name, status, objectives) VALUES (?, ?, ?, ?, ?, ?)";
    const stmt = this.db.prepare(sql);
    stmt.run([
      goal.id ?? crypto.randomUUID(),
      goal.room_id,
      goal.user_id,
      goal.name,
      goal.status,
      JSON.stringify(goal.objectives),
    ]);
    stmt.free();
  }

  async removeGoal(goalId: UUID): Promise<void> {
    const sql = "DELETE FROM goals WHERE id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([goalId]);
    stmt.free();
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    const sql = "DELETE FROM goals WHERE room_id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([room_id]);
    stmt.free();
  }

  async createRoom(name: string): Promise<UUID> {
    const roomId = crypto.randomUUID();
    try {
      const sql = "INSERT INTO rooms (id, name) VALUES (?, ?)";
      const stmt = this.db.prepare(sql);
      stmt.run([roomId, name]);
      stmt.free();
    } catch (error) {
      console.log("Error creating room", error);
    }
    return roomId as UUID;
  }

  async removeRoom(roomId: UUID): Promise<void> {
    const sql = "DELETE FROM rooms WHERE id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([roomId]);
    stmt.free();
  }

  async getRoomsByParticipant(userId: UUID): Promise<UUID[]> {
    const sql = "SELECT room_id FROM participants WHERE user_id = ?";
    const stmt = this.db.prepare(sql);
    stmt.bind([userId]);
    const rows: { room_id: string }[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as { room_id: string };
      rows.push(row);
    }
    stmt.free();
    return rows.map((row) => row.room_id as UUID);
  }

  async getRoomsByParticipants(userIds: UUID[]): Promise<UUID[]> {
    // Assuming userIds is an array of UUID strings, prepare a list of placeholders
    const placeholders = userIds.map(() => "?").join(", ");
    // Construct the SQL query with the correct number of placeholders
    const sql = `SELECT room_id FROM participants WHERE user_id IN (${placeholders})`;
    const stmt = this.db.prepare(sql);
    // Execute the query with the userIds array spread into arguments
    stmt.bind(userIds);
    const rows: { room_id: string }[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject() as unknown as { room_id: string };
      rows.push(row);
    }
    stmt.free();
    // Map and return the room_id values as UUIDs
    return rows.map((row) => row.room_id as UUID);
  }

  async addParticipantToRoom(userId: UUID, roomId: UUID): Promise<void> {
    const sql =
      "INSERT INTO participants (id, user_id, room_id) VALUES (?, ?, ?)";
    const stmt = this.db.prepare(sql);
    stmt.run([crypto.randomUUID(), userId, roomId]);
    stmt.free();
  }

  async removeParticipantFromRoom(userId: UUID, roomId: UUID): Promise<void> {
    const sql = "DELETE FROM participants WHERE user_id = ? AND room_id = ?";
    const stmt = this.db.prepare(sql);
    stmt.run([userId, roomId]);
    stmt.free();
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    if (!params.userA || !params.userB) {
      throw new Error("userA and userB are required");
    }
    const sql =
      "INSERT INTO relationships (id, user_a, user_b, user_id) VALUES (?, ?, ?, ?)";
    const stmt = this.db.prepare(sql);
    stmt.run([crypto.randomUUID(), params.userA, params.userB, params.userA]);
    stmt.free();
    return true;
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    const sql =
      "SELECT * FROM relationships WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)";
    const stmt = this.db.prepare(sql);
    stmt.bind([params.userA, params.userB, params.userB, params.userA]);
    const relationship = stmt.getAsObject() as unknown as
      | Relationship
      | undefined;
    stmt.free();
    return relationship || null;
  }

  async getRelationships(params: { userId: UUID }): Promise<Relationship[]> {
    const sql = "SELECT * FROM relationships WHERE (user_a = ? OR user_b = ?)";
    const stmt = this.db.prepare(sql);
    stmt.bind([params.userId, params.userId]);
    const relationships: Relationship[] = [];
    while (stmt.step()) {
      const relationship = stmt.getAsObject() as unknown as Relationship;
      relationships.push(relationship);
    }
    stmt.free();
    return relationships;
  }
}

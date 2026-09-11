// File: /src/lib/adapters/mongodb.ts
import {
  MongoClient,
  Db,
  Collection,
  type Filter,
  type Document,
} from "mongodb";
import {
  type Memory,
  type Goal,
  type Relationship,
  Actor,
  GoalStatus,
  Account,
  type UUID,
  Participant,
} from "../types";
import { DatabaseAdapter } from "../database";
import { v4 as uuid } from "uuid";

/**
 * MongoDB implementation of the DatabaseAdapter.
 *
 * Uses one collection per entity type (rooms, accounts, participants,
 * memories, goals, logs, relationships). Embeddings are stored as plain
 * arrays on memory documents (and can be queried with Atlas Vector Search
 * via `$vectorSearch` when the index is configured; otherwise we fall back
 * to a cosine-similarity scan over the stored embedding arrays).
 */
export class MongoDatabaseAdapter extends DatabaseAdapter {
  private client: MongoClient;
  private db: Db;

  constructor(uri: string, dbName = "bgent") {
    super();
    this.client = new MongoClient(uri);
    this.db = this.client.db(dbName);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private rooms(): Collection<Document> {
    return this.db.collection("rooms");
  }
  private accounts(): Collection<Document> {
    return this.db.collection("accounts");
  }
  private participants(): Collection<Document> {
    return this.db.collection("participants");
  }
  private memories(): Collection<Document> {
    return this.db.collection("memories");
  }
  private goals(): Collection<Document> {
    return this.db.collection("goals");
  }
  private logs(): Collection<Document> {
    return this.db.collection("logs");
  }
  private relationships(): Collection<Document> {
    return this.db.collection("relationships");
  }

  // ---------- deterministic row <-> doc mapping ----------
  private mapEntry<T>(doc: Document): T {
    if (!doc) return doc as T;
    const { _id, ...rest } = doc;
    return rest as T;
  }

  private memoryFromDoc(doc: Document): Memory {
    return {
      id: doc._id?.toString() as UUID,
      user_id: doc.user_id,
      created_at: doc.created_at,
      content:
        typeof doc.content === "string"
          ? { content: doc.content }
          : doc.content,
      embedding: doc.embedding,
      room_id: doc.room_id,
    };
  }

  private goalFromDoc(doc: Document): Goal {
    return {
      id: doc._id?.toString() as UUID,
      room_id: doc.room_id,
      user_id: doc.user_id,
      name: doc.name,
      status: doc.status,
      objectives: doc.objectives ?? [],
    };
  }

  // ---------- vector search (cosine over stored embeddings) ----------
  private dot(a: number[], b: number[]): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  private norm(a: number[]): number {
    return Math.sqrt(this.dot(a, a));
  }

  private cosine(a: number[], b: number[]): number {
    const na = this.norm(a);
    const nb = this.norm(b);
    if (na === 0 || nb === 0) return 0;
    return this.dot(a, b) / (na * nb);
  }

  // ---------- rooms ----------
  async getRoom(room_id: UUID): Promise<UUID | null> {
    const doc = await this.rooms().findOne({ id: room_id });
    return doc ? (room_id as UUID) : null;
  }

  async createRoom(room_id?: UUID): Promise<UUID> {
    const id = (room_id ?? uuid()) as UUID;
    await this.rooms().insertOne({ id, created_at: new Date().toISOString() });
    return id;
  }

  async removeRoom(room_id: UUID): Promise<void> {
    await this.rooms().deleteOne({ id: room_id });
  }

  // ---------- participants ----------
  async getParticipantsForAccount(user_id: UUID): Promise<Participant[]> {
    const docs = await this.participants().find({ user_id }).toArray();
    return docs.map((d) => this.mapEntry<Participant>(d));
  }

  async getParticipantsForRoom(room_id: UUID): Promise<UUID[]> {
    const docs = await this.participants().find({ room_id }).toArray();
    return docs.map((d) => d.user_id as UUID);
  }

  async addParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    try {
      await this.participants().insertOne({ user_id, room_id });
      return true;
    } catch (e) {
      console.error(`Error adding participant: ${(e as Error).message}`);
      return false;
    }
  }

  async removeParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    try {
      await this.participants().deleteOne({ user_id, room_id });
      return true;
    } catch (e) {
      console.error(`Error removing participant: ${(e as Error).message}`);
      return false;
    }
  }

  async getRoomsForParticipant(user_id: UUID): Promise<UUID[]> {
    const docs = await this.participants().find({ user_id }).toArray();
    return docs.map((d) => d.room_id as UUID);
  }

  async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
    const docs = await this.participants()
      .find({ user_id: { $in: userIds } })
      .toArray();
    return [...new Set(docs.map((d) => d.room_id as UUID))];
  }

  // ---------- accounts ----------
  async getAccountById(user_id: UUID): Promise<Account | null> {
    const doc = await this.accounts().findOne({ id: user_id });
    return doc ? this.mapEntry<Account>(doc) : null;
  }

  async createAccount(account: Account): Promise<boolean> {
    try {
      await this.accounts().insertOne({ ...account, id: account.id ?? uuid() });
      return true;
    } catch (e) {
      console.error((e as Error).message);
      return false;
    }
  }

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    const pDocs = await this.participants()
      .find({ room_id: params.room_id })
      .toArray();
    const userIds = pDocs.map((p) => p.user_id);
    const aDocs = await this.accounts().find({ id: { $in: userIds } }).toArray();
    return aDocs.map((a) => ({
      name: a.name,
      details: a.details,
      id: a.id,
    })) as Actor[];
  }

  // ---------- memories ----------
  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    if (unique && memory.embedding) {
      // check for a near-identical memory before inserting
      const similar = await this.searchMemoriesByEmbedding(memory.embedding, {
        tableName,
        room_id: memory.room_id,
        match_threshold: 0.95,
        count: 1,
      });
      if (similar.length > 0) return;
    }
    await this.memories().insertOne({
      id: memory.id ?? uuid(),
      user_id: memory.user_id,
      created_at: memory.created_at ?? new Date().toISOString(),
      content:
        typeof memory.content === "string"
          ? { content: memory.content }
          : memory.content,
      embedding: memory.embedding ?? [],
      room_id: memory.room_id,
      type: tableName,
      unique,
    });
  }

  async getMemories(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    if (!params.tableName) throw new Error("tableName is required");
    const filter: Filter<Document> = {
      type: params.tableName,
      room_id: params.room_id,
    };
    if (params.unique) filter.unique = true;
    let cursor = this.memories().find(filter).sort({ created_at: -1 });
    if (params.count) cursor = cursor.limit(params.count);
    const docs = await cursor.toArray();
    return docs.map((d) => this.memoryFromDoc(d));
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    await this.memories().deleteOne({ type: tableName, id: memoryId });
  }

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    await this.memories().deleteMany({ type: tableName, room_id });
  }

  async countMemories(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    if (!tableName) throw new Error("tableName is required");
    const filter: Filter<Document> = { type: tableName, room_id };
    if (unique) filter.unique = true;
    return this.memories().countDocuments(filter);
  }

  private async searchMemoriesBase(params: {
    tableName: string;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    room_id?: UUID;
    unique?: boolean;
  }): Promise<Memory[]> {
    const all = await this.memories()
      .find({ type: params.tableName, embedding: { $exists: true, $ne: [] } })
      .toArray();
    const scored = all
      .map((d) => ({
        d,
        score: this.cosine(params.embedding, d.embedding as number[]),
      }))
      .filter(({ score }) => score >= params.match_threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, params.match_count);

    return scored.map(({ d }) => this.memoryFromDoc(d));
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    return this.searchMemoriesBase({
      ...params,
      room_id: params.room_id,
      unique: params.unique,
    });
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
    return this.searchMemoriesBase({
      tableName: params.tableName,
      embedding,
      match_threshold: params.match_threshold ?? 0,
      match_count: params.count ?? 10,
      room_id: params.room_id,
      unique: params.unique,
    });
  }

  async getCachedEmbeddings(opts: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
    const all = await this.memories()
      .find({
        type: opts.query_table_name,
        embedding: { $exists: true, $ne: [] },
      })
      .limit(opts.query_match_count)
      .toArray();
    return all.map((d) => ({
      embedding: d.embedding as number[],
      levenshtein_score: 0,
    }));
  }

  // ---------- goals ----------
  async getGoals(params: {
    room_id: UUID;
    user_id?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    const filter: Filter<Document> = { room_id: params.room_id };
    if (params.user_id) filter.user_id = params.user_id;
    if (params.onlyInProgress) filter.status = GoalStatus.IN_PROGRESS;
    let cursor = this.goals().find(filter);
    if (params.count) cursor = cursor.limit(params.count);
    const docs = await cursor.toArray();
    return docs.map((d) => this.goalFromDoc(d));
  }

  async updateGoal(goal: Goal): Promise<void> {
    await this.goals().updateOne(
      { id: goal.id },
      {
        $set: {
          name: goal.name,
          status: goal.status,
          objectives: goal.objectives ?? [],
        },
      },
    );
  }

  async createGoal(goal: Goal): Promise<void> {
    await this.goals().insertOne({
      id: goal.id ?? uuid(),
      room_id: goal.room_id,
      user_id: goal.user_id,
      name: goal.name,
      status: goal.status,
      objectives: goal.objectives ?? [],
    });
  }

  async removeGoal(goalId: UUID): Promise<void> {
    await this.goals().deleteOne({ id: goalId });
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    await this.goals().deleteMany({ room_id });
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    await this.goals().updateOne(
      { id: params.goalId },
      { $set: { status: params.status } },
    );
  }

  // ---------- logs ----------
  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void> {
    await this.logs().insertOne({
      body: params.body,
      user_id: params.user_id,
      room_id: params.room_id,
      type: params.type,
      created_at: new Date().toISOString(),
    });
  }

  // ---------- relationships ----------
  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    try {
      await this.relationships().insertOne({
        user_a: params.userA,
        user_b: params.userB,
        created_at: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    const doc = await this.relationships().findOne({
      $or: [
        { user_a: params.userA, user_b: params.userB },
        { user_a: params.userB, user_b: params.userA },
      ],
    });
    return doc ? (this.mapEntry<Relationship>(doc) as Relationship) : null;
  }

  async getRelationships(params: { user_id: UUID }): Promise<Relationship[]> {
    const docs = await this.relationships()
      .find({
        $or: [{ user_a: params.user_id }, { user_b: params.user_id }],
      })
      .toArray();
    return docs.map((d) => this.mapEntry<Relationship>(d));
  }
}

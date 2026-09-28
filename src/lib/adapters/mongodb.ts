import { randomUUID } from "node:crypto";
import {
  MongoServerError,
  type Collection,
  type Db,
  type Filter,
} from "mongodb";
import { DatabaseAdapter } from "../database";
import {
  type Account,
  type Actor,
  type Goal,
  GoalStatus,
  type Memory,
  type Participant,
  type Relationship,
  type UUID,
} from "../types";

export interface MongoDBAdapterOptions {
  /** Must match the embeddings supplied to createMemory and vector searches. */
  dimensions?: number;
  vectorIndexName?: string;
  /** Maximum time to wait for an asynchronously created search index. */
  indexTimeoutMs?: number;
}

type StoredMemory = Memory & {
  id: UUID;
  created_at: string;
  type: string;
  unique: boolean;
};
type StoredGoal = Goal & { id: UUID; created_at: string };
type Membership = { id: UUID; user_id: UUID; room_id: UUID };
type StoredRelationship = Relationship & { pair: string };
type VectorIndexState = {
  status?: string;
  queryable?: boolean;
  latestDefinition?: { fields: Array<Record<string, unknown>> };
};

/**
 * Node.js adapter for MongoDB with MongoDB Vector Search.
 * The caller owns the MongoClient connection and must close it when finished.
 */
export class MongoDBDatabaseAdapter extends DatabaseAdapter {
  readonly db: Db;
  readonly dimensions: number;
  readonly vectorIndexName: string;
  private readonly indexTimeoutMs: number;
  private readonly accounts: Collection<Account>;
  private readonly memories: Collection<StoredMemory>;
  private readonly goals: Collection<StoredGoal>;
  private readonly participants: Collection<Membership>;
  private readonly rooms: Collection<{ id: UUID; created_at: string }>;
  private readonly relationships: Collection<StoredRelationship>;

  constructor(db: Db, options: MongoDBAdapterOptions = {}) {
    super();
    this.db = db;
    this.dimensions = options.dimensions ?? 1536;
    this.vectorIndexName = options.vectorIndexName ?? "bgent_memory_vector";
    this.indexTimeoutMs = options.indexTimeoutMs ?? 60000;
    if (!Number.isInteger(this.dimensions) || this.dimensions < 1) {
      throw new Error("dimensions must be a positive integer");
    }
    if (!Number.isFinite(this.indexTimeoutMs) || this.indexTimeoutMs < 0) {
      throw new Error("indexTimeoutMs must be nonnegative");
    }
    this.accounts = db.collection<Account>("accounts");
    this.memories = db.collection<StoredMemory>("memories");
    this.goals = db.collection<StoredGoal>("goals");
    this.participants = db.collection<Membership>("participants");
    this.rooms = db.collection("rooms");
    this.relationships = db.collection<StoredRelationship>("relationships");
  }

  /** Create ordinary and vector indexes. Call once before using the adapter. */
  async init(): Promise<void> {
    await Promise.all([
      this.accounts.createIndex({ id: 1 }, { unique: true }),
      this.rooms.createIndex({ id: 1 }, { unique: true }),
      this.memories.createIndex({ id: 1 }, { unique: true }),
      this.memories.createIndex({ type: 1, room_id: 1, created_at: -1 }),
      this.goals.createIndex({ id: 1 }, { unique: true }),
      this.goals.createIndex({ room_id: 1, user_id: 1, status: 1 }),
      this.participants.createIndex(
        { user_id: 1, room_id: 1 },
        { unique: true },
      ),
      this.participants.createIndex({ room_id: 1 }),
      this.relationships.createIndex({ pair: 1 }, { unique: true }),
      this.relationships.createIndex({ user_a: 1 }),
      this.relationships.createIndex({ user_b: 1 }),
    ]);
    const existing = await this.memories
      .listSearchIndexes(this.vectorIndexName)
      .toArray();
    if (existing.length === 0) {
      try {
        await this.memories.createSearchIndex({
          name: this.vectorIndexName,
          type: "vectorSearch",
          definition: {
            fields: [
              {
                type: "vector",
                path: "embedding",
                numDimensions: this.dimensions,
                similarity: "cosine",
              },
              ...["type", "room_id", "unique"].map((path) => ({
                type: "filter",
                path,
              })),
            ],
          },
        });
      } catch (error) {
        // Another process may create this named index after our list call.
        // Still wait for and validate its definition; propagate other errors.
        const duplicateName =
          error instanceof MongoServerError &&
          (error.code === 68 ||
            (error.code === 2 &&
              error.message.startsWith(
                "duplicate index names for the same collection: ",
              )));
        if (!duplicateName) throw error;
      }
    }
    await this.waitForVectorIndex();
  }

  private async waitForVectorIndex(): Promise<void> {
    const deadline = Date.now() + this.indexTimeoutMs;
    do {
      const [index] = (await this.memories
        .listSearchIndexes(this.vectorIndexName)
        .toArray()) as VectorIndexState[];
      if (index?.status === "FAILED") {
        throw new Error("MongoDB vector index failed to build");
      }
      if (index?.queryable) {
        const fields = index.latestDefinition?.fields as
          | Array<Record<string, unknown>>
          | undefined;
        const vector = fields?.find((field) => field.path === "embedding");
        if (
          vector?.numDimensions !== this.dimensions ||
          vector?.similarity !== "cosine" ||
          !["type", "room_id", "unique"].every((path) =>
            fields?.some(
              (field) => field.path === path && field.type === "filter",
            ),
          )
        ) {
          throw new Error(
            "Existing MongoDB vector index has an incompatible definition",
          );
        }
        return;
      }
      if (Date.now() >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    } while (Date.now() <= deadline);
    throw new Error("Timed out waiting for the MongoDB vector index");
  }

  async getAccountById(user_id: UUID): Promise<Account | null> {
    return this.accounts.findOne({ id: user_id }, { projection: { _id: 0 } });
  }

  async createAccount(account: Account): Promise<boolean> {
    await this.accounts.updateOne(
      { id: account.id },
      { $set: account },
      { upsert: true },
    );
    return true;
  }

  async getActorDetails({ room_id }: { room_id: UUID }): Promise<Actor[]> {
    const ids = await this.getParticipantsForRoom(room_id);
    const accounts = await this.accounts.find({ id: { $in: ids } }).toArray();
    return accounts.map((account) => {
      const details = account.details ?? {};
      return {
        id: account.id,
        name: account.name,
        details: {
          tagline: typeof details.tagline === "string" ? details.tagline : "",
          summary: typeof details.summary === "string" ? details.summary : "",
          quote: typeof details.quote === "string" ? details.quote : "",
        },
      };
    });
  }

  async getMemories(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    const count = this.limit(params.count ?? 10);
    if (count === 0) return [];
    return this.memories
      .find(this.memoryFilter(params), { projection: { _id: 0 } })
      .sort({ created_at: -1, id: 1 })
      .limit(count)
      .toArray();
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    return this.searchMemoriesByEmbedding(params.embedding, {
      ...params,
      count: params.match_count,
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
    this.validateEmbedding(embedding, true);
    const count = this.limit(params.count ?? 10);
    const threshold = params.match_threshold ?? 0.1;
    if (count > 10000) {
      throw new Error("Vector search count cannot exceed 10000");
    }
    if (!Number.isFinite(threshold) || threshold < -1 || threshold > 1) {
      throw new Error("match_threshold must be between -1 and 1");
    }
    if (count === 0) return [];
    return this.memories
      .aggregate<Memory>([
        {
          $vectorSearch: {
            index: this.vectorIndexName,
            path: "embedding",
            queryVector: embedding,
            numCandidates: Math.min(10000, Math.max(100, count * 20)),
            limit: count,
            filter: this.memoryFilter(params),
          },
        },
        // MongoDB normalizes cosine scores to [0, 1]; the adapter contract
        // follows Supabase's cosine similarity in [-1, 1].
        {
          $set: {
            similarity: {
              $subtract: [
                { $multiply: [{ $meta: "vectorSearchScore" }, 2] },
                1,
              ],
            },
          },
        },
        { $match: { similarity: { $gt: threshold } } },
        { $project: { _id: 0 } },
      ])
      .toArray();
  }

  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    this.memoryFilter({ tableName });
    if (memory.embedding) this.validateEmbedding(memory.embedding);
    let isUnique = true;
    if (unique && memory.embedding) {
      // Read the collection directly: the asynchronous search index may not
      // yet contain a memory inserted immediately before this call.
      const candidates = this.memories.find(
        {
          type: tableName,
          room_id: memory.room_id,
          user_id: memory.user_id,
          embedding: { $exists: true },
        },
        { projection: { embedding: 1 } },
      );
      try {
        for await (const candidate of candidates) {
          if (
            candidate.embedding &&
            this.cosine(memory.embedding, candidate.embedding) > 0.95
          ) {
            isUnique = false;
            break;
          }
        }
      } finally {
        await candidates.close();
      }
    }
    await this.memories.insertOne(
      {
        ...memory,
        id: memory.id ?? randomUUID(),
        created_at: new Date(memory.created_at ?? Date.now()).toISOString(),
        type: tableName,
        unique: isUnique,
      },
      { ignoreUndefined: true },
    );
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    await this.memories.deleteOne({
      ...this.memoryFilter({ tableName }),
      id: memoryId,
    });
  }

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    await this.memories.deleteMany(this.memoryFilter({ room_id, tableName }));
  }

  async countMemories(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    return this.memories.countDocuments(
      this.memoryFilter({ room_id, unique, tableName }),
    );
  }

  async getCachedEmbeddings(params: {
    query_table_name: string;
    query_threshold: number;
    query_input: string;
    query_field_name: string;
    query_field_sub_name: string;
    query_match_count: number;
  }): Promise<{ embedding: number[]; levenshtein_score: number }[]> {
    const count = this.limit(params.query_match_count);
    const threshold = this.limit(params.query_threshold);
    if (count === 0) return [];
    const field = params.query_field_name;
    const subfield = params.query_field_sub_name;
    if (![field, subfield].every((key) => /^[a-zA-Z_]\w*$/.test(key))) {
      throw new Error(
        "Embedding cache field names must be simple property names",
      );
    }
    const matches: { embedding: number[]; levenshtein_score: number }[] = [];
    const cursor = this.memories.find({
      ...this.memoryFilter({ tableName: params.query_table_name }),
      embedding: { $exists: true },
    });
    for await (const memory of cursor) {
      const value = (memory as unknown as Record<string, unknown>)[field];
      const text =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[subfield]
          : undefined;
      if (typeof text !== "string" || !memory.embedding) continue;
      const score =
        Array.from(params.query_input).length > 255
          ? params.query_input === text
            ? 0
            : Infinity
          : levenshtein(params.query_input, text);
      if (score <= threshold) {
        matches.push({ embedding: memory.embedding, levenshtein_score: score });
      }
    }
    return matches
      .sort((a, b) => a.levenshtein_score - b.levenshtein_score)
      .slice(0, count);
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void> {
    await this.db.collection("logs").insertOne({
      ...params,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    });
  }

  async getGoals(params: {
    room_id: UUID;
    user_id?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    const count = this.limit(params.count ?? 10);
    if (count === 0) return [];
    const filter: Filter<StoredGoal> = { room_id: params.room_id };
    if (params.user_id) filter.user_id = params.user_id;
    if (params.onlyInProgress) filter.status = GoalStatus.IN_PROGRESS;
    return this.goals
      .find(filter, { projection: { _id: 0 } })
      .sort({ created_at: -1, id: 1 })
      .limit(count)
      .toArray();
  }

  async createGoal(goal: Goal): Promise<void> {
    await this.goals.insertOne({
      ...goal,
      id: goal.id ?? randomUUID(),
      created_at: new Date().toISOString(),
    });
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (!goal.id) throw new Error("goal.id is required");
    await this.goals.updateOne({ id: goal.id }, { $set: goal });
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    await this.goals.updateOne(
      { id: params.goalId },
      { $set: { status: params.status } },
    );
  }

  async removeGoal(goalId: UUID): Promise<void> {
    await this.goals.deleteOne({ id: goalId });
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    await this.goals.deleteMany({ room_id });
  }

  async getRoom(room_id: UUID): Promise<UUID | null> {
    const room = await this.rooms.findOne({ id: room_id });
    return room?.id ?? null;
  }

  async createRoom(room_id: UUID = randomUUID()): Promise<UUID> {
    await this.rooms.updateOne(
      { id: room_id },
      { $setOnInsert: { id: room_id, created_at: new Date().toISOString() } },
      { upsert: true },
    );
    return room_id;
  }

  /** Delete a room and its dependent records atomically on a replica set. */
  async removeRoom(room_id: UUID): Promise<void> {
    await this.db.client.withSession(async (session) => {
      await session.withTransaction(async () => {
        await this.memories.deleteMany({ room_id }, { session });
        await this.goals.deleteMany({ room_id }, { session });
        await this.participants.deleteMany({ room_id }, { session });
        await this.relationships.deleteMany({ room_id }, { session });
        await this.db.collection("logs").deleteMany({ room_id }, { session });
        await this.rooms.deleteOne({ id: room_id }, { session });
      });
    });
  }

  async getRoomsForParticipant(user_id: UUID): Promise<UUID[]> {
    return this.participants.distinct("room_id", { user_id });
  }

  async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
    return this.participants.distinct("room_id", { user_id: { $in: userIds } });
  }

  async addParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    if (
      !(await this.getAccountById(user_id)) ||
      !(await this.getRoom(room_id))
    ) {
      return false;
    }
    await this.participants.updateOne(
      { user_id, room_id },
      { $setOnInsert: { id: randomUUID(), user_id, room_id } },
      { upsert: true },
    );
    return true;
  }

  async removeParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    await this.participants.deleteOne({ user_id, room_id });
    return true;
  }

  async getParticipantsForAccount(user_id: UUID): Promise<Participant[]> {
    const account = await this.getAccountById(user_id);
    if (!account) return [];
    const memberships = await this.participants
      .find({ user_id }, { projection: { _id: 0 } })
      .toArray();
    return memberships.map((membership) => ({ ...membership, account }));
  }

  async getParticipantsForRoom(room_id: UUID): Promise<UUID[]> {
    return this.participants.distinct("user_id", { room_id });
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    if (
      !(await this.getAccountById(params.userA)) ||
      !(await this.getAccountById(params.userB))
    ) {
      return false;
    }
    const roomsA = await this.getRoomsForParticipant(params.userA);
    const roomsB = await this.getRoomsForParticipant(params.userB);
    const pair = this.relationshipPair(params.userA, params.userB);
    const relationship = await this.relationships.findOneAndUpdate(
      { pair },
      {
        $setOnInsert: {
          id: randomUUID(),
          pair,
          user_a: params.userA,
          user_b: params.userB,
          user_id: params.userA,
          room_id: roomsA.find((room) => roomsB.includes(room)) ?? randomUUID(),
          status: "FRIENDS",
          created_at: new Date().toISOString(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (!relationship) throw new Error("Could not create relationship");
    await this.createRoom(relationship.room_id);
    await this.addParticipant(params.userA, relationship.room_id);
    await this.addParticipant(params.userB, relationship.room_id);
    return true;
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    return this.relationships.findOne(
      { pair: this.relationshipPair(params.userA, params.userB) },
      { projection: { _id: 0, pair: 0 } },
    );
  }

  async getRelationships(params: { user_id: UUID }): Promise<Relationship[]> {
    return this.relationships
      .find(
        {
          $or: [{ user_a: params.user_id }, { user_b: params.user_id }],
          status: "FRIENDS",
        },
        { projection: { _id: 0, pair: 0 } },
      )
      .toArray();
  }

  private relationshipPair(userA: UUID, userB: UUID): string {
    return [userA, userB].sort().join(":");
  }

  private memoryFilter(params: {
    tableName: string;
    room_id?: UUID;
    unique?: boolean;
  }): Filter<StoredMemory> {
    if (typeof params.tableName !== "string" || !params.tableName) {
      throw new Error("tableName is required");
    }
    const filter: Filter<StoredMemory> = { type: params.tableName };
    if (params.room_id) filter.room_id = params.room_id;
    if (params.unique) filter.unique = true;
    return filter;
  }

  private limit(value: number): number {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Counts and distances must be nonnegative integers");
    }
    return value;
  }

  private validateEmbedding(embedding: number[], query = false): void {
    if (
      !Array.isArray(embedding) ||
      embedding.length !== this.dimensions ||
      !Array.from(embedding).every(Number.isFinite)
    ) {
      throw new Error(
        "Embedding must contain " + this.dimensions + " finite numbers",
      );
    }
    if (query && !embedding.some((value) => value !== 0)) {
      throw new Error("Cosine search requires a nonzero query embedding");
    }
  }

  private cosine(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
  }
}

function levenshtein(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) {
      next[j + 1] = Math.min(
        next[j] + 1,
        row[j + 1] + 1,
        row[j] + (a[i] === b[j] ? 0 : 1),
      );
    }
    row = next;
  }
  return row[b.length];
}

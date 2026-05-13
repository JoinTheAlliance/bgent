import {
  type Collection,
  type Db,
  type Document,
  type Filter,
  type MongoClient,
  MongoServerError,
} from "mongodb";
import { v4 as uuid } from "uuid";

import { DatabaseAdapter } from "../database";
import {
  Account,
  Actor,
  GoalStatus,
  type Goal,
  type Memory,
  Participant,
  type Relationship,
  type UUID,
} from "../types";

export interface MongoDbVectorSearchOptions {
  /**
   * Atlas Search vector index name. When omitted, vector search uses the
   * local cosine-similarity fallback.
   */
  indexName?: string;
  /**
   * Path to the memory embedding field in the MongoDB document.
   */
  path?: string;
  /**
   * Number of candidates to request from Atlas Vector Search.
   */
  numCandidates?: number;
  /**
   * Enables Atlas `$vectorSearch`. Keep this disabled for local MongoDB.
   */
  useAtlasVectorSearch?: boolean;
  /**
   * Falls back to local cosine search if Atlas vector search is unavailable.
   */
  fallbackToCosine?: boolean;
}

export interface MongoDbDatabaseAdapterOptions {
  collectionPrefix?: string;
  vectorSearch?: MongoDbVectorSearchOptions;
}

type MongoMemoryDocument = Omit<Memory, "created_at"> & {
  id: UUID;
  type: string;
  unique: boolean;
  created_at: Date;
  similarity?: number;
};

type MongoGoalDocument = Goal & { id: UUID };

type MongoRelationshipDocument = Relationship & { id: UUID };

type MongoParticipantDocument = {
  id: UUID;
  user_id: UUID;
  room_id: UUID;
  last_message_read?: string;
};

type MongoLogDocument = {
  body: { [key: string]: unknown };
  user_id: UUID;
  room_id: UUID;
  type: string;
  created_at: Date;
};

const defaultVectorSearchOptions: Required<MongoDbVectorSearchOptions> = {
  indexName: "memory_embedding_vector_index",
  path: "embedding",
  numCandidates: 100,
  useAtlasVectorSearch: false,
  fallbackToCosine: true,
};

export class MongoDbDatabaseAdapter extends DatabaseAdapter {
  private db: Db;
  private collectionPrefix: string;
  private vectorSearch: Required<MongoDbVectorSearchOptions>;
  private indexesPromise?: Promise<void>;

  constructor(db: Db, options: MongoDbDatabaseAdapterOptions = {}) {
    super();
    this.db = db;
    this.collectionPrefix = options.collectionPrefix ?? "";
    this.vectorSearch = {
      ...defaultVectorSearchOptions,
      ...options.vectorSearch,
    };
  }

  static async connect(
    client: MongoClient,
    dbName: string,
    options: MongoDbDatabaseAdapterOptions = {},
  ): Promise<MongoDbDatabaseAdapter> {
    await client.connect();
    return new MongoDbDatabaseAdapter(client.db(dbName), options);
  }

  private collection<T extends Document>(name: string): Collection<T> {
    return this.db.collection<T>(`${this.collectionPrefix}${name}`);
  }

  private async ensureIndexes(): Promise<void> {
    this.indexesPromise ??= Promise.all([
      this.collection<Account>("accounts").createIndex(
        { id: 1 },
        { unique: true },
      ),
      this.collection<Document>("rooms").createIndex(
        { id: 1 },
        { unique: true },
      ),
      this.collection<MongoParticipantDocument>("participants").createIndex(
        { user_id: 1, room_id: 1 },
        { unique: true },
      ),
      this.collection<MongoMemoryDocument>("memories").createIndex(
        { id: 1 },
        { unique: true },
      ),
      this.collection<MongoMemoryDocument>("memories").createIndex({
        type: 1,
        room_id: 1,
        unique: 1,
        created_at: -1,
      }),
      this.collection<MongoGoalDocument>("goals").createIndex(
        { id: 1 },
        { unique: true },
      ),
      this.collection<MongoGoalDocument>("goals").createIndex({
        room_id: 1,
        user_id: 1,
        status: 1,
      }),
      this.collection<MongoRelationshipDocument>("relationships").createIndex(
        { user_a: 1, user_b: 1 },
        { unique: true },
      ),
      this.collection<MongoRelationshipDocument>("relationships").createIndex({
        user_id: 1,
        status: 1,
      }),
    ]).then(() => undefined);

    return this.indexesPromise;
  }

  private normalizeMemory(memory: MongoMemoryDocument): Memory & {
    similarity?: number;
  } {
    return {
      id: memory.id,
      user_id: memory.user_id,
      room_id: memory.room_id,
      content: memory.content,
      embedding: memory.embedding,
      created_at: memory.created_at?.toISOString?.() ?? memory.created_at,
      ...(typeof memory.similarity === "number"
        ? { similarity: memory.similarity }
        : {}),
    };
  }

  private getComparableValue(
    memory: Record<string, unknown>,
    field: string,
    subField: string,
  ) {
    const value = memory[field];
    if (subField && value && typeof value === "object") {
      return (value as Record<string, unknown>)[subField];
    }
    return value;
  }

  private levenshtein(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

    for (let i = 0; i < a.length; i += 1) {
      let last = i;
      previous[0] = i + 1;

      for (let j = 0; j < b.length; j += 1) {
        const old = previous[j + 1];
        const cost = a[i] === b[j] ? 0 : 1;
        previous[j + 1] = Math.min(
          previous[j + 1] + 1,
          previous[j] + 1,
          last + cost,
        );
        last = old;
      }
    }

    return previous[b.length];
  }

  private cosineSimilarity(left: number[], right?: number[]): number {
    if (!right || left.length === 0 || right.length === 0) {
      return 0;
    }

    const length = Math.min(left.length, right.length);
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index += 1) {
      dot += left[index] * right[index];
      leftMagnitude += left[index] * left[index];
      rightMagnitude += right[index] * right[index];
    }

    const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
    return denominator === 0 ? 0 : dot / denominator;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }

  async getAccountById(user_id: UUID): Promise<Account | null> {
    await this.ensureIndexes();
    const account = await this.collection<Account>("accounts").findOne(
      { id: user_id } as Filter<Account>,
      { projection: { _id: 0 } },
    );
    return account;
  }

  async createAccount(account: Account): Promise<boolean> {
    await this.ensureIndexes();
    await this.collection<Account>("accounts").updateOne(
      { id: account.id } as Filter<Account>,
      { $set: account },
      { upsert: true },
    );
    return true;
  }

  async getMemories(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    await this.ensureIndexes();
    const filter: Filter<MongoMemoryDocument> = {
      type: params.tableName,
      room_id: params.room_id,
    };

    if (params.unique) {
      filter.unique = true;
    }

    let cursor = this.collection<MongoMemoryDocument>("memories")
      .find(filter, { projection: { _id: 0 } })
      .sort({ created_at: -1 });

    if (params.count) {
      cursor = cursor.limit(params.count);
    }

    const memories = await cursor.toArray();
    return memories.map((memory) => this.normalizeMemory(memory));
  }

  async getCachedEmbeddings({
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
  > {
    await this.ensureIndexes();
    const memories = await this.collection<MongoMemoryDocument>("memories")
      .find(
        { type: query_table_name, embedding: { $type: "array" } },
        { projection: { _id: 0 } },
      )
      .toArray();

    return memories
      .map((memory) => {
        const comparable = this.getComparableValue(
          memory,
          query_field_name,
          query_field_sub_name,
        );
        const text = typeof comparable === "string" ? comparable : "";
        const maxLength = Math.max(query_input.length, text.length, 1);
        const score = 1 - this.levenshtein(query_input, text) / maxLength;
        return {
          embedding: memory.embedding ?? [],
          levenshtein_score: score,
        };
      })
      .filter((result) => result.levenshtein_score >= query_threshold)
      .sort((left, right) => right.levenshtein_score - left.levenshtein_score)
      .slice(0, query_match_count);
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void> {
    await this.ensureIndexes();
    const log: MongoLogDocument = {
      ...params,
      created_at: new Date(),
    };
    await this.collection<MongoLogDocument>("logs").insertOne(log);
  }

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    await this.ensureIndexes();
    const participants = await this.collection<MongoParticipantDocument>(
      "participants",
    )
      .find({ room_id: params.room_id }, { projection: { _id: 0 } })
      .toArray();

    const accounts = await this.collection<Account>("accounts")
      .find(
        {
          id: { $in: participants.map((participant) => participant.user_id) },
        } as Filter<Account>,
        { projection: { _id: 0 } },
      )
      .toArray();

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      details: account.details as Actor["details"],
    }));
  }

  async searchMemories(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    if (this.vectorSearch.useAtlasVectorSearch) {
      try {
        return await this.searchMemoriesWithAtlasVectorSearch(params);
      } catch (error) {
        if (!this.vectorSearch.fallbackToCosine) {
          throw error;
        }
      }
    }

    return this.searchMemoriesWithCosine(params);
  }

  private async searchMemoriesWithAtlasVectorSearch(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    await this.ensureIndexes();
    const filter: Record<string, string | boolean> = {
      type: params.tableName,
      room_id: params.room_id,
    };

    if (params.unique) {
      filter.unique = true;
    }

    const pipeline = [
      {
        $vectorSearch: {
          index: this.vectorSearch.indexName,
          path: this.vectorSearch.path,
          queryVector: params.embedding,
          numCandidates: Math.max(
            this.vectorSearch.numCandidates,
            params.match_count * 20,
          ),
          limit: params.match_count,
          filter,
        },
      },
      {
        $addFields: {
          similarity: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: {
          similarity: { $gte: params.match_threshold },
        },
      },
      {
        $project: { _id: 0 },
      },
    ];

    const memories = await this.collection<MongoMemoryDocument>("memories")
      .aggregate<MongoMemoryDocument>(pipeline)
      .toArray();

    return memories.map((memory) => this.normalizeMemory(memory));
  }

  private async searchMemoriesWithCosine(params: {
    tableName: string;
    room_id: UUID;
    embedding: number[];
    match_threshold: number;
    match_count: number;
    unique: boolean;
  }): Promise<Memory[]> {
    await this.ensureIndexes();
    const filter: Filter<MongoMemoryDocument> = {
      type: params.tableName,
      room_id: params.room_id,
      embedding: { $type: "array" },
    };

    if (params.unique) {
      filter.unique = true;
    }

    const memories = await this.collection<MongoMemoryDocument>("memories")
      .find(filter, { projection: { _id: 0 } })
      .toArray();

    return memories
      .map((memory) => ({
        ...memory,
        similarity: this.cosineSimilarity(params.embedding, memory.embedding),
      }))
      .filter((memory) => memory.similarity >= params.match_threshold)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, params.match_count)
      .map((memory) => this.normalizeMemory(memory));
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoGoalDocument>("goals").updateOne(
      { id: params.goalId },
      { $set: { status: params.status } },
    );
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
    if (!params.room_id) {
      throw new Error("room_id is required for MongoDB memory search");
    }

    return this.searchMemories({
      tableName: params.tableName,
      room_id: params.room_id,
      embedding,
      match_threshold: params.match_threshold ?? 0.1,
      match_count: params.count ?? 10,
      unique: !!params.unique,
    });
  }

  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    await this.ensureIndexes();
    let isUnique = true;

    if (unique && memory.embedding) {
      const similarMemories = await this.searchMemoriesByEmbedding(
        memory.embedding,
        {
          tableName,
          room_id: memory.room_id,
          match_threshold: 0.95,
          count: 1,
          unique: true,
        },
      );
      isUnique = similarMemories.length === 0;
    }

    await this.collection<MongoMemoryDocument>("memories").insertOne({
      id: memory.id ?? (uuid() as UUID),
      type: tableName,
      content: memory.content,
      embedding: memory.embedding,
      user_id: memory.user_id,
      room_id: memory.room_id,
      unique: isUnique,
      created_at: memory.created_at ? new Date(memory.created_at) : new Date(),
    });
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoMemoryDocument>("memories").deleteOne({
      id: memoryId,
      type: tableName,
    });
  }

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoMemoryDocument>("memories").deleteMany({
      room_id,
      type: tableName,
    });
  }

  async countMemories(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    await this.ensureIndexes();
    if (!tableName) {
      throw new Error("tableName is required");
    }

    const filter: Filter<MongoMemoryDocument> = {
      room_id,
      type: tableName,
    };

    if (unique) {
      filter.unique = true;
    }

    return this.collection<MongoMemoryDocument>("memories").countDocuments(
      filter,
    );
  }

  async getGoals(params: {
    room_id: UUID;
    user_id?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    await this.ensureIndexes();
    const filter: Filter<MongoGoalDocument> = { room_id: params.room_id };

    if (params.user_id) {
      filter.user_id = params.user_id;
    }

    if (params.onlyInProgress) {
      filter.status = GoalStatus.IN_PROGRESS;
    }

    let cursor = this.collection<MongoGoalDocument>("goals").find(filter, {
      projection: { _id: 0 },
    });

    if (params.count) {
      cursor = cursor.limit(params.count);
    }

    return cursor.toArray();
  }

  async updateGoal(goal: Goal): Promise<void> {
    await this.ensureIndexes();
    if (!goal.id) {
      throw new Error("goal.id is required");
    }

    await this.collection<MongoGoalDocument>("goals").updateOne(
      { id: goal.id },
      { $set: goal },
    );
  }

  async createGoal(goal: Goal): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoGoalDocument>("goals").insertOne({
      ...goal,
      id: goal.id ?? (uuid() as UUID),
    });
  }

  async removeGoal(goalId: UUID): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoGoalDocument>("goals").deleteOne({
      id: goalId,
    });
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    await this.ensureIndexes();
    await this.collection<MongoGoalDocument>("goals").deleteMany({ room_id });
  }

  async getRoom(room_id: UUID): Promise<UUID | null> {
    await this.ensureIndexes();
    const room = await this.collection<{ id: UUID }>("rooms").findOne(
      { id: room_id },
      { projection: { _id: 0 } },
    );
    return room?.id ?? null;
  }

  async createRoom(room_id?: UUID): Promise<UUID> {
    await this.ensureIndexes();
    const id = room_id ?? (uuid() as UUID);

    try {
      await this.collection<{ id: UUID }>("rooms").insertOne({ id });
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }
    }

    return id;
  }

  async removeRoom(room_id: UUID): Promise<void> {
    await this.ensureIndexes();
    await this.collection<{ id: UUID }>("rooms").deleteOne({ id: room_id });
  }

  async getRoomsForParticipant(user_id: UUID): Promise<UUID[]> {
    await this.ensureIndexes();
    const participants = await this.collection<MongoParticipantDocument>(
      "participants",
    )
      .find({ user_id }, { projection: { _id: 0, room_id: 1 } })
      .toArray();

    return participants.map((participant) => participant.room_id);
  }

  async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
    await this.ensureIndexes();
    const participants = await this.collection<MongoParticipantDocument>(
      "participants",
    )
      .find(
        { user_id: { $in: userIds } },
        { projection: { _id: 0, room_id: 1 } },
      )
      .toArray();

    return [...new Set(participants.map((participant) => participant.room_id))];
  }

  async addParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    await this.ensureIndexes();
    try {
      await this.collection<MongoParticipantDocument>("participants").insertOne(
        {
          id: uuid() as UUID,
          user_id,
          room_id,
        },
      );
      return true;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return true;
      }
      return false;
    }
  }

  async removeParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    await this.ensureIndexes();
    const result = await this.collection<MongoParticipantDocument>(
      "participants",
    ).deleteOne({ user_id, room_id });
    return result.acknowledged;
  }

  async getParticipantsForAccount(user_id: UUID): Promise<Participant[]> {
    await this.ensureIndexes();
    const participants = await this.collection<MongoParticipantDocument>(
      "participants",
    )
      .find({ user_id }, { projection: { _id: 0 } })
      .toArray();

    return participants as unknown as Participant[];
  }

  async getParticipantsForRoom(room_id: UUID): Promise<UUID[]> {
    await this.ensureIndexes();
    const participants = await this.collection<MongoParticipantDocument>(
      "participants",
    )
      .find({ room_id }, { projection: { _id: 0, user_id: 1 } })
      .toArray();

    return participants.map((participant) => participant.user_id);
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    await this.ensureIndexes();
    const room_id = await this.createRoom();
    await this.addParticipant(params.userA, room_id);
    await this.addParticipant(params.userB, room_id);

    try {
      await this.collection<MongoRelationshipDocument>(
        "relationships",
      ).insertOne({
        id: uuid() as UUID,
        user_a: params.userA,
        user_b: params.userB,
        user_id: params.userA,
        room_id,
        status: "FRIENDS",
        created_at: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return true;
      }
      return false;
    }
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    await this.ensureIndexes();
    const relationship = await this.collection<MongoRelationshipDocument>(
      "relationships",
    ).findOne(
      {
        $or: [
          { user_a: params.userA, user_b: params.userB },
          { user_a: params.userB, user_b: params.userA },
        ],
      },
      { projection: { _id: 0 } },
    );

    return relationship;
  }

  async getRelationships(params: { user_id: UUID }): Promise<Relationship[]> {
    await this.ensureIndexes();
    return this.collection<MongoRelationshipDocument>("relationships")
      .find(
        {
          $or: [{ user_a: params.user_id }, { user_b: params.user_id }],
          status: "FRIENDS",
        },
        { projection: { _id: 0 } },
      )
      .toArray();
  }
}

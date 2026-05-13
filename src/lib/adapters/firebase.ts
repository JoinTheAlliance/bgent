import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { v4 } from "uuid";

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

type FirestoreData = Record<string, unknown>;

type FirestoreDocumentSnapshot = {
  id: string;
  exists: boolean;
  data(): FirestoreData | undefined;
};

type FirestoreQuerySnapshot = {
  docs: FirestoreDocumentSnapshot[];
  empty?: boolean;
};

type FirestoreDocumentReference = {
  id: string;
  get(): Promise<FirestoreDocumentSnapshot>;
  set(data: FirestoreData, options?: { merge?: boolean }): Promise<unknown>;
  update(data: FirestoreData): Promise<unknown>;
  delete(): Promise<unknown>;
};

type FirestoreQuery = {
  where(fieldPath: string, opStr: string, value: unknown): FirestoreQuery;
  orderBy(fieldPath: string, directionStr?: "asc" | "desc"): FirestoreQuery;
  limit(limit: number): FirestoreQuery;
  get(): Promise<FirestoreQuerySnapshot>;
  findNearest?(options: {
    vectorField: string;
    queryVector: number[];
    limit: number;
    distanceMeasure: FirebaseVectorDistanceMeasure;
    distanceResultField?: string;
  }): { get(): Promise<FirestoreQuerySnapshot> };
};

type FirestoreCollectionReference = FirestoreQuery & {
  doc(documentPath?: string): FirestoreDocumentReference;
};

function isDefined<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

export type FirebaseVectorDistanceMeasure =
  | "EUCLIDEAN"
  | "COSINE"
  | "DOT_PRODUCT";

export interface FirebaseDatabaseAdapterConfig {
  app?: App;
  firestore?: {
    collection(collectionPath: string): FirestoreCollectionReference;
  };
  projectId?: string;
  serviceAccount?: ServiceAccount;
  collectionPrefix?: string;
  useFirestoreVectorSearch?: boolean;
  storeVectorValue?: boolean;
  vectorDistanceMeasure?: FirebaseVectorDistanceMeasure;
  vectorDistanceResultField?: string;
}

export class FirebaseDatabaseAdapter extends DatabaseAdapter {
  private firestore: {
    collection(collectionPath: string): FirestoreCollectionReference;
  };

  private collectionPrefix: string;
  private useFirestoreVectorSearch: boolean;
  private storeVectorValue: boolean;
  private vectorDistanceMeasure: FirebaseVectorDistanceMeasure;
  private vectorDistanceResultField?: string;

  constructor(config: FirebaseDatabaseAdapterConfig = {}) {
    super();

    this.firestore = config.firestore ?? getFirestore(this.getApp(config));
    this.collectionPrefix = config.collectionPrefix ?? "";
    this.useFirestoreVectorSearch = config.useFirestoreVectorSearch ?? true;
    this.storeVectorValue = config.storeVectorValue ?? true;
    this.vectorDistanceMeasure = config.vectorDistanceMeasure ?? "COSINE";
    this.vectorDistanceResultField = config.vectorDistanceResultField;
  }

  async getAccountById(user_id: UUID): Promise<Account | null> {
    const snapshot = await this.collection("accounts").doc(user_id).get();
    return snapshot.exists ? (this.fromSnapshot<Account>(snapshot) ?? null) : null;
  }

  async createAccount(account: Account): Promise<boolean> {
    const id = account.id ?? (v4() as UUID);
    await this.collection("accounts")
      .doc(id)
      .set({ ...account, id }, { merge: true });
    return true;
  }

  async getMemories(params: {
    room_id: UUID;
    count?: number;
    unique?: boolean;
    tableName: string;
  }): Promise<Memory[]> {
    let query = this.collection("memories")
      .where("type", "==", params.tableName)
      .where("room_id", "==", params.room_id);

    if (params.unique) {
      query = query.where("unique", "==", true);
    }

    query = query.orderBy("created_at", "desc");

    if (params.count) {
      query = query.limit(params.count);
    }

    return this.memoriesFromSnapshot(await query.get());
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
    const snapshot = await this.collection("memories")
      .where("type", "==", opts.query_table_name)
      .limit(opts.query_match_count)
      .get();

    const input = opts.query_input.toLowerCase();

    return snapshot.docs
      .map((doc) => this.fromSnapshot<Memory & FirestoreData>(doc))
      .filter(isDefined)
      .map((memory) => ({
        memory,
        value: String(
          this.getByPath(
            memory,
            [opts.query_field_name, opts.query_field_sub_name].filter(Boolean),
          ) ?? "",
        ).toLowerCase(),
      }))
      .filter(({ value }) => value.includes(input) || input.includes(value))
      .map(({ memory }) => ({
        embedding: this.normalizeEmbedding(memory),
        levenshtein_score: 0,
      }));
  }

  async log(params: {
    body: { [key: string]: unknown };
    user_id: UUID;
    room_id: UUID;
    type: string;
  }): Promise<void> {
    const id = v4();
    await this.collection("logs").doc(id).set({
      ...params,
      id,
      created_at: this.now(),
    });
  }

  async getActorDetails(params: { room_id: UUID }): Promise<Actor[]> {
    const participants = await this.getParticipantsForRoom(params.room_id);
    const actors = await Promise.all(
      participants.map((user_id) => this.getAccountById(user_id)),
    );

    return actors
      .filter((account): account is Account => Boolean(account))
      .map((account) => ({
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
    return this.searchMemoriesByEmbedding(params.embedding, {
      tableName: params.tableName,
      room_id: params.room_id,
      match_threshold: params.match_threshold,
      count: params.match_count,
      unique: params.unique,
    });
  }

  async updateGoalStatus(params: {
    goalId: UUID;
    status: GoalStatus;
  }): Promise<void> {
    await this.collection("goals").doc(params.goalId).update({
      status: params.status,
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
    const limit = params.count ?? 10;
    let query = this.collection("memories").where("type", "==", params.tableName);

    if (params.room_id) {
      query = query.where("room_id", "==", params.room_id);
    }

    if (params.unique) {
      query = query.where("unique", "==", true);
    }

    if (this.useFirestoreVectorSearch && query.findNearest) {
      const vectorSnapshot = await query
        .findNearest({
          vectorField: "embedding",
          queryVector: embedding,
          limit,
          distanceMeasure: this.vectorDistanceMeasure,
          distanceResultField: this.vectorDistanceResultField,
        })
        .get();

      return this.memoriesFromSnapshot(vectorSnapshot);
    }

    const snapshot = await query.get();
    return snapshot.docs
      .map((doc) => this.fromSnapshot<Memory & FirestoreData>(doc))
      .filter(isDefined)
      .map((memory) => ({
        memory: this.normalizeMemory(memory),
        similarity: this.cosineSimilarity(embedding, this.normalizeEmbedding(memory)),
      }))
      .filter(
        ({ similarity }) =>
          params.match_threshold === undefined ||
          similarity >= params.match_threshold,
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ memory }) => memory);
  }

  async createMemory(
    memory: Memory,
    tableName: string,
    unique = false,
  ): Promise<void> {
    const embedding = memory.embedding ?? [];
    let isUnique = true;

    if (unique && embedding.length > 0) {
      const matches = await this.searchMemoriesByEmbedding(embedding, {
        tableName,
        room_id: memory.room_id,
        match_threshold: 0.95,
        count: 1,
      });
      isUnique = matches.length === 0;
    }

    const id = memory.id ?? (v4() as UUID);
    const data: FirestoreData = {
      ...memory,
      id,
      type: tableName,
      unique: isUnique,
      created_at: memory.created_at ?? this.now(),
      embedding_values: embedding,
    };

    if (embedding.length > 0) {
      data.embedding = this.toFirestoreEmbedding(embedding);
    }

    await this.collection("memories").doc(id).set(data);
  }

  async removeMemory(memoryId: UUID, tableName: string): Promise<void> {
    const snapshot = await this.collection("memories")
      .where("id", "==", memoryId)
      .where("type", "==", tableName)
      .get();

    await Promise.all(snapshot.docs.map((doc) => this.deleteDoc(doc, "memories")));
  }

  async removeAllMemories(room_id: UUID, tableName: string): Promise<void> {
    const snapshot = await this.collection("memories")
      .where("room_id", "==", room_id)
      .where("type", "==", tableName)
      .get();

    await Promise.all(snapshot.docs.map((doc) => this.deleteDoc(doc, "memories")));
  }

  async countMemories(
    room_id: UUID,
    unique = true,
    tableName = "",
  ): Promise<number> {
    if (!tableName) {
      throw new Error("tableName is required");
    }

    let query = this.collection("memories")
      .where("room_id", "==", room_id)
      .where("type", "==", tableName);

    if (unique) {
      query = query.where("unique", "==", true);
    }

    const snapshot = await query.get();
    return snapshot.docs.length;
  }

  async getGoals(params: {
    room_id: UUID;
    user_id?: UUID | null;
    onlyInProgress?: boolean;
    count?: number;
  }): Promise<Goal[]> {
    let query = this.collection("goals").where("room_id", "==", params.room_id);

    if (params.user_id) {
      query = query.where("user_id", "==", params.user_id);
    }

    if (params.onlyInProgress) {
      query = query.where("status", "==", GoalStatus.IN_PROGRESS);
    }

    if (params.count) {
      query = query.limit(params.count);
    }

    const snapshot = await query.get();
    return snapshot.docs
      .map((doc) => this.fromSnapshot<Goal>(doc))
      .filter(isDefined);
  }

  async updateGoal(goal: Goal): Promise<void> {
    if (!goal.id) {
      throw new Error("goal.id is required");
    }
    await this.collection("goals")
      .doc(goal.id)
      .set(goal as unknown as FirestoreData, {
        merge: true,
      });
  }

  async createGoal(goal: Goal): Promise<void> {
    const id = goal.id ?? (v4() as UUID);
    await this.collection("goals").doc(id).set({
      ...goal,
      id,
      created_at: this.now(),
    });
  }

  async removeGoal(goalId: UUID): Promise<void> {
    await this.collection("goals").doc(goalId).delete();
  }

  async removeAllGoals(room_id: UUID): Promise<void> {
    const snapshot = await this.collection("goals")
      .where("room_id", "==", room_id)
      .get();

    await Promise.all(snapshot.docs.map((doc) => this.deleteDoc(doc, "goals")));
  }

  async getRoom(room_id: UUID): Promise<UUID | null> {
    const snapshot = await this.collection("rooms").doc(room_id).get();
    return snapshot.exists ? room_id : null;
  }

  async createRoom(room_id?: UUID): Promise<UUID> {
    const id = room_id ?? (v4() as UUID);
    await this.collection("rooms").doc(id).set(
      {
        id,
        created_at: this.now(),
      },
      { merge: true },
    );
    return id;
  }

  async removeRoom(room_id: UUID): Promise<void> {
    await this.collection("rooms").doc(room_id).delete();
  }

  async getRoomsForParticipant(user_id: UUID): Promise<UUID[]> {
    const snapshot = await this.collection("participants")
      .where("user_id", "==", user_id)
      .get();

    return snapshot.docs
      .map((doc) => this.fromSnapshot<Participant & { room_id?: UUID }>(doc))
      .filter(isDefined)
      .filter(
        (participant): participant is Participant & { room_id: UUID } =>
          Boolean(participant.room_id),
      )
      .map((participant) => participant.room_id);
  }

  async getRoomsForParticipants(userIds: UUID[]): Promise<UUID[]> {
    const roomSets = await Promise.all(
      userIds.map(async (userId) => new Set(await this.getRoomsForParticipant(userId))),
    );

    if (roomSets.length === 0) {
      return [];
    }

    return [...roomSets[0]].filter((roomId) =>
      roomSets.every((rooms) => rooms.has(roomId)),
    );
  }

  async addParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    const id = this.participantId(user_id, room_id);
    await this.collection("participants").doc(id).set(
      {
        id,
        user_id,
        room_id,
        created_at: this.now(),
      },
      { merge: true },
    );
    return true;
  }

  async removeParticipant(user_id: UUID, room_id: UUID): Promise<boolean> {
    await this.collection("participants")
      .doc(this.participantId(user_id, room_id))
      .delete();
    return true;
  }

  async getParticipantsForAccount(user_id: UUID): Promise<Participant[]> {
    const snapshot = await this.collection("participants")
      .where("user_id", "==", user_id)
      .get();

    return snapshot.docs
      .map((doc) => this.fromSnapshot<Participant>(doc))
      .filter(isDefined);
  }

  async getParticipantsForRoom(room_id: UUID): Promise<UUID[]> {
    const snapshot = await this.collection("participants")
      .where("room_id", "==", room_id)
      .get();

    return snapshot.docs
      .map((doc) => this.fromSnapshot<{ user_id?: UUID }>(doc))
      .filter(isDefined)
      .filter(
        (participant): participant is { user_id: UUID } =>
          Boolean(participant.user_id),
      )
      .map((participant) => participant.user_id);
  }

  async createRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<boolean> {
    const rooms = await this.getRoomsForParticipants([params.userA, params.userB]);
    const room_id = rooms[0] ?? (await this.createRoom());

    await Promise.all([
      this.addParticipant(params.userA, room_id),
      this.addParticipant(params.userB, room_id),
    ]);

    const id = this.relationshipId(params.userA, params.userB);
    await this.collection("relationships").doc(id).set(
      {
        id,
        user_a: params.userA,
        user_b: params.userB,
        user_id: params.userA,
        room_id,
        status: "FRIENDS",
        created_at: this.now(),
      },
      { merge: true },
    );

    return true;
  }

  async getRelationship(params: {
    userA: UUID;
    userB: UUID;
  }): Promise<Relationship | null> {
    const snapshot = await this.collection("relationships")
      .doc(this.relationshipId(params.userA, params.userB))
      .get();

    return snapshot.exists
      ? (this.fromSnapshot<Relationship>(snapshot) ?? null)
      : null;
  }

  async getRelationships(params: { user_id: UUID }): Promise<Relationship[]> {
    const [asA, asB] = await Promise.all([
      this.collection("relationships").where("user_a", "==", params.user_id).get(),
      this.collection("relationships").where("user_b", "==", params.user_id).get(),
    ]);

    const byId = new Map<string, Relationship>();
    [...asA.docs, ...asB.docs]
      .map((doc) => this.fromSnapshot<Relationship>(doc))
      .filter(isDefined)
      .forEach((relationship) => byId.set(relationship.id, relationship));

    return [...byId.values()].filter(
      (relationship) => relationship.status === "FRIENDS",
    );
  }

  private getApp(config: FirebaseDatabaseAdapterConfig): App {
    if (config.app) {
      return config.app;
    }

    const [existingApp] = getApps();
    if (existingApp) {
      return existingApp;
    }

    if (config.serviceAccount) {
      return initializeApp({
        credential: cert(config.serviceAccount),
        projectId: config.projectId,
      });
    }

    return initializeApp(
      config.projectId ? { projectId: config.projectId } : undefined,
    );
  }

  private collection(name: string): FirestoreCollectionReference {
    return this.firestore.collection(
      this.collectionPrefix ? `${this.collectionPrefix}_${name}` : name,
    );
  }

  private memoriesFromSnapshot(snapshot: FirestoreQuerySnapshot): Memory[] {
    return snapshot.docs
      .map((doc) => this.fromSnapshot<Memory & FirestoreData>(doc))
      .filter(isDefined)
      .map((memory) => this.normalizeMemory(memory));
  }

  private normalizeMemory(memory: Memory & FirestoreData): Memory {
    return {
      ...memory,
      content:
        typeof memory.content === "string"
          ? JSON.parse(memory.content)
          : memory.content,
      embedding: this.normalizeEmbedding(memory),
    };
  }

  private normalizeEmbedding(memory: FirestoreData): number[] {
    const embedding = memory.embedding_values ?? memory.embedding;

    if (Array.isArray(embedding)) {
      return embedding as number[];
    }

    if (
      embedding &&
      typeof embedding === "object" &&
      "toArray" in embedding &&
      typeof embedding.toArray === "function"
    ) {
      return embedding.toArray() as number[];
    }

    return [];
  }

  private toFirestoreEmbedding(embedding: number[]): unknown {
    if (this.storeVectorValue && typeof FieldValue.vector === "function") {
      return FieldValue.vector(embedding);
    }

    return embedding;
  }

  private fromSnapshot<T>(snapshot: FirestoreDocumentSnapshot): T | null {
    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return {
      ...data,
      id: (data.id ?? snapshot.id) as UUID,
    } as T;
  }

  private async deleteDoc(
    snapshot: FirestoreDocumentSnapshot,
    collectionName: string,
  ): Promise<unknown> {
    return this.collection(collectionName).doc(snapshot.id).delete();
  }

  private cosineSimilarity(left: number[], right: number[]): number {
    if (left.length === 0 || left.length !== right.length) {
      return 0;
    }

    const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
    const leftMagnitude = Math.sqrt(
      left.reduce((sum, value) => sum + value * value, 0),
    );
    const rightMagnitude = Math.sqrt(
      right.reduce((sum, value) => sum + value * value, 0),
    );

    if (leftMagnitude === 0 || rightMagnitude === 0) {
      return 0;
    }

    return dot / (leftMagnitude * rightMagnitude);
  }

  private getByPath(source: FirestoreData, path: string[]): unknown {
    return path.reduce<unknown>((value, key) => {
      if (!value || typeof value !== "object") {
        return undefined;
      }
      return (value as FirestoreData)[key];
    }, source);
  }

  private participantId(user_id: UUID, room_id: UUID): string {
    return `${room_id}_${user_id}`;
  }

  private relationshipId(userA: UUID, userB: UUID): string {
    return [userA, userB].sort().join("_");
  }

  private now(): string {
    return new Date().toISOString();
  }
}

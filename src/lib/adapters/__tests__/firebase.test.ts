import { FirebaseDatabaseAdapter } from "../firebase";
import { GoalStatus, type Memory, type UUID } from "../../types";

type StoredData = Record<string, unknown>;

class FakeDocumentSnapshot {
  constructor(
    public id: string,
    private value: StoredData | undefined,
  ) {}

  get exists() {
    return Boolean(this.value);
  }

  data() {
    return this.value ? { ...this.value } : undefined;
  }
}

class FakeQuerySnapshot {
  constructor(public docs: FakeDocumentSnapshot[]) {}

  get empty() {
    return this.docs.length === 0;
  }
}

class FakeDocumentReference {
  constructor(
    private collectionStore: Map<string, StoredData>,
    public id: string,
  ) {}

  async get() {
    return new FakeDocumentSnapshot(this.id, this.collectionStore.get(this.id));
  }

  async set(data: StoredData, options?: { merge?: boolean }) {
    const previous = this.collectionStore.get(this.id) ?? {};
    this.collectionStore.set(this.id, {
      ...(options?.merge ? previous : {}),
      ...data,
      id: data.id ?? this.id,
    });
  }

  async update(data: StoredData) {
    const previous = this.collectionStore.get(this.id) ?? {};
    this.collectionStore.set(this.id, { ...previous, ...data });
  }

  async delete() {
    this.collectionStore.delete(this.id);
  }
}

class FakeQuery {
  constructor(
    protected firestore: FakeFirestore,
    protected collectionName: string,
    private filters: Array<{ field: string; value: unknown }> = [],
    private order?: { field: string; direction: "asc" | "desc" },
    private maxResults?: number,
  ) {}

  where(field: string, op: string, value: unknown) {
    if (op !== "==") {
      throw new Error(`Unsupported fake Firestore operator: ${op}`);
    }
    return new FakeQuery(
      this.firestore,
      this.collectionName,
      [...this.filters, { field, value }],
      this.order,
      this.maxResults,
    );
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new FakeQuery(
      this.firestore,
      this.collectionName,
      this.filters,
      { field, direction },
      this.maxResults,
    );
  }

  limit(limit: number) {
    return new FakeQuery(
      this.firestore,
      this.collectionName,
      this.filters,
      this.order,
      limit,
    );
  }

  async get() {
    let docs = [...this.firestore.storeFor(this.collectionName).entries()]
      .filter(([, data]) =>
        this.filters.every((filter) => data[filter.field] === filter.value),
      )
      .map(([id, data]) => new FakeDocumentSnapshot(id, data));

    if (this.order) {
      docs = docs.sort((left, right) => {
        const leftValue = left.data()?.[this.order!.field];
        const rightValue = right.data()?.[this.order!.field];
        const result = String(leftValue).localeCompare(String(rightValue));
        return this.order!.direction === "asc" ? result : -result;
      });
    }

    if (this.maxResults !== undefined) {
      docs = docs.slice(0, this.maxResults);
    }

    return new FakeQuerySnapshot(docs);
  }

  findNearest(options: {
    vectorField: string;
    queryVector: number[];
    limit: number;
    distanceMeasure: string;
    distanceResultField?: string;
  }) {
    this.firestore.vectorQueries.push(options);

    return {
      get: async () => {
        const snapshot = await this.get();
        const docs = snapshot.docs
          .map((doc) => ({
            doc,
            similarity: cosine(
              options.queryVector,
              doc.data()?.embedding_values as number[],
            ),
          }))
          .sort((left, right) => right.similarity - left.similarity)
          .slice(0, options.limit)
          .map(({ doc }) => doc);

        return new FakeQuerySnapshot(docs);
      },
    };
  }
}

class FakeCollectionReference extends FakeQuery {
  doc(id = fakeUuid()) {
    return new FakeDocumentReference(this.firestore.storeFor(this.collectionName), id);
  }
}

class FakeFirestore {
  collections = new Map<string, Map<string, StoredData>>();
  vectorQueries: Array<{
    vectorField: string;
    queryVector: number[];
    limit: number;
    distanceMeasure: string;
    distanceResultField?: string;
  }> = [];

  collection(name: string) {
    return new FakeCollectionReference(this, name);
  }

  storeFor(name: string) {
    let collection = this.collections.get(name);
    if (!collection) {
      collection = new Map<string, StoredData>();
      this.collections.set(name, collection);
    }
    return collection;
  }
}

const userA = "00000000-0000-0000-0000-000000000001" as UUID;
const userB = "00000000-0000-0000-0000-000000000002" as UUID;
const roomId = "00000000-0000-0000-0000-000000000003" as UUID;
let uuidCounter = 0;

function createAdapter(options: {
  useFirestoreVectorSearch?: boolean;
  firestore?: FakeFirestore;
} = {}) {
  return new FirebaseDatabaseAdapter({
    firestore: options.firestore ?? new FakeFirestore(),
    useFirestoreVectorSearch: options.useFirestoreVectorSearch ?? false,
    storeVectorValue: false,
  });
}

function memory(content: string, embedding: number[]): Memory {
  return {
    id: fakeUuid() as UUID,
    user_id: userA,
    room_id: roomId,
    content: { content },
    embedding,
  };
}

function fakeUuid() {
  uuidCounter += 1;
  return `10000000-0000-4000-8000-${uuidCounter
    .toString()
    .padStart(12, "0")}`;
}

function cosine(left: number[], right: number[]) {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  const leftMagnitude = Math.sqrt(
    left.reduce((sum, value) => sum + value * value, 0),
  );
  const rightMagnitude = Math.sqrt(
    right.reduce((sum, value) => sum + value * value, 0),
  );
  return dot / (leftMagnitude * rightMagnitude);
}

describe("FirebaseDatabaseAdapter", () => {
  test("creates accounts, rooms, participants, and relationships", async () => {
    const adapter = createAdapter();

    await adapter.createAccount({
      id: userA,
      name: "Ada",
      email: "ada@example.com",
      details: { tagline: "Builder", summary: "Writes tests", quote: "Ship it" },
    });
    await adapter.createAccount({
      id: userB,
      name: "Grace",
      email: "grace@example.com",
    });

    expect(await adapter.getAccountById(userA)).toMatchObject({
      id: userA,
      name: "Ada",
    });

    expect(await adapter.createRelationship({ userA, userB })).toBe(true);

    const relationship = await adapter.getRelationship({ userA, userB });
    expect(relationship).toMatchObject({
      user_a: userA,
      user_b: userB,
      status: "FRIENDS",
    });
    expect(await adapter.getRoom(relationship!.room_id)).toBe(relationship!.room_id);
    expect(await adapter.getParticipantsForRoom(relationship!.room_id)).toEqual([
      userA,
      userB,
    ]);
    expect(await adapter.getRelationships({ user_id: userA })).toHaveLength(1);
  });

  test("stores goals and updates goal status", async () => {
    const adapter = createAdapter();
    const goalId = "00000000-0000-0000-0000-000000000004" as UUID;

    await adapter.createGoal({
      id: goalId,
      room_id: roomId,
      user_id: userA,
      name: "Test Firebase",
      status: GoalStatus.IN_PROGRESS,
      objectives: [{ description: "Write adapter tests", completed: false }],
    });
    await adapter.updateGoalStatus({ goalId, status: GoalStatus.DONE });

    expect(await adapter.getGoals({ room_id: roomId })).toMatchObject([
      {
        id: goalId,
        status: GoalStatus.DONE,
      },
    ]);
  });

  test("falls back to local cosine ranking when Firestore vector search is disabled", async () => {
    const adapter = createAdapter();

    await adapter.createMemory(memory("high similarity", [1, 0]), "messages");
    await adapter.createMemory(memory("low similarity", [0, 1]), "messages");

    const results = await adapter.searchMemoriesByEmbedding([0.95, 0.05], {
      tableName: "messages",
      room_id: roomId,
      count: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].content.content).toBe("high similarity");
    expect(await adapter.countMemories(roomId, true, "messages")).toBe(2);
  });

  test("uses Firestore findNearest when vector search is enabled", async () => {
    const firestore = new FakeFirestore();
    const adapter = createAdapter({
      firestore,
      useFirestoreVectorSearch: true,
    });

    await adapter.createMemory(memory("nearest", [1, 0]), "messages");
    await adapter.createMemory(memory("farther", [0, 1]), "messages");

    const results = await adapter.searchMemoriesByEmbedding([1, 0], {
      tableName: "messages",
      room_id: roomId,
      count: 1,
    });

    expect(firestore.vectorQueries).toMatchObject([
      {
        vectorField: "embedding",
        limit: 1,
        distanceMeasure: "COSINE",
      },
    ]);
    expect(results[0].content.content).toBe("nearest");
  });
});

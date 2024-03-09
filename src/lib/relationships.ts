import { type UUID } from "crypto";
import { type BgentRuntime } from "./runtime";
import { type Relationship } from "./types";

export async function createRelationship({
  runtime,
  userA,
  userB,
}: {
  runtime: BgentRuntime;
  userA: UUID;
  userB: UUID;
}): Promise<boolean> {
  return runtime.databaseAdapter.createRelationship({
    userA,
    userB,
  });
}

export async function getRelationship({
  runtime,
  userA,
  userB,
}: {
  runtime: BgentRuntime;
  userA: UUID;
  userB: UUID;
}) {
  return runtime.databaseAdapter.getRelationship({
    userA,
    userB,
  });
}

export async function getRelationships({
  runtime,
  userId,
}: {
  runtime: BgentRuntime;
  userId: UUID;
}) {
  return runtime.databaseAdapter.getRelationships({ userId });
}

export async function formatRelationships({
  runtime,
  userId,
}: {
  runtime: BgentRuntime;
  userId: UUID;
}) {
  const relationships = await getRelationships({ runtime, userId });

  const formattedRelationships = relationships.map(
    (relationship: Relationship) => {
      const { user_a, user_b } = relationship;

      if (user_a === userId) {
        return user_b;
      }

      return user_a;
    },
  );

  return formattedRelationships;
}

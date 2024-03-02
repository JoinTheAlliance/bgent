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
  const { error } = await runtime.supabase.from("relationships").upsert({
    user_a: userA,
    user_b: userB,
    user_id: userA,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getRelationship({
  runtime,
  userA,
  userB,
}: {
  runtime: BgentRuntime;
  userA: string;
  userB: string;
}) {
  const { data, error } = await runtime.supabase.rpc("get_relationship", {
    usera: userA,
    userb: userB,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data[0];
}

export async function getRelationships({
  runtime,
  userId,
}: {
  runtime: BgentRuntime;
  userId: string;
}) {
  const { data, error } = await runtime.supabase
    .from("relationships")
    .select("*")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq("status", "FRIENDS");

  if (error) {
    throw new Error(error.message);
  }

  return data as Relationship[];
}

export async function formatRelationships({
  runtime,
  userId,
}: {
  runtime: BgentRuntime;
  userId: string;
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

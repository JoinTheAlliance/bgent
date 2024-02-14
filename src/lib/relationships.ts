import { type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { type Relationship } from "./types";

export async function createRelationship({
  supabase,
  userA,
  userB,
}: {
  supabase: SupabaseClient;
  userA: UUID;
  userB: UUID;
}) {
  const { data, error } = await supabase.from("relationships").upsert({
    user_a: userA,
    user_b: userB,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRelationship({
  supabase,
  userA,
  userB,
}: {
  supabase: SupabaseClient;
  userA: string;
  userB: string;
}) {
  const { data, error } = await supabase.rpc("get_relationship", {
    usera: userA,
    userb: userB,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data[0];
}

export async function getRelationships({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const { data, error } = await supabase
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
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const relationships = await getRelationships({ supabase, userId });

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

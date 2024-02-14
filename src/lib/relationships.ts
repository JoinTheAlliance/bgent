import { type SupabaseClient } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import { type Relationship } from "./types";

/** create a connection
 * @todo This should only be allowable by the current user if they are connected to both userA and userB
 */
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

/**
 * custom function to query relationships by embedding
 * pull all actors in scene and compare their embeddings to the user's rolodex to draw in relevant matches
 * @todo Implement this function
 * @param {object} options
 * @param {object} options.supabase
 * @param {string} options.userId
 * @param {object} options.embedding
 */
// export async function searchRelationships({ supabase, userId, embedding }) {
// }

// export async function createProfileEmbedding({ supabase, agent, runtime }: { supabase: SupabaseClient, agent: Actor, runtime: BgentRuntime }) {
//   if (runtime.debugMode) {
//     console.log(`Creating profile embedding for ${agent.name}`);
//   }
//   const embedding = await runtime.embed(agent.description);
//   const { data, error } = await supabase.from("accounts").update({ profile_embedding: embedding }).eq("id", agent.id);
//   if (error) {
//     throw new Error(error.message);
//   }

//   return data;
// }

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

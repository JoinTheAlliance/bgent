import { UUID } from "crypto";
import { BgentRuntime, Relationship, getRelationship } from "../lib";

export async function getOrCreateRelationship({
  runtime,
  userA,
  userB,
}: {
  runtime: BgentRuntime;
  userA: UUID;
  userB: UUID;
}): Promise<Relationship> {
  // Check if a relationship already exists between userA and userB
  let relationship: Relationship | null = null;
  try {
    relationship = await getRelationship({ runtime, userA, userB });
  } catch (error) {
    console.log("Error fetching relationship", error);
  }
  // Check if a room already exists for the participants
  const rooms = await runtime.databaseAdapter.getRoomsByParticipants([
    userA,
    userB,
  ]);

  let room_id: UUID;
  if (!rooms || rooms.length === 0) {
    // If no room exists, create a new room for the relationship
    room_id = await runtime.databaseAdapter.createRoom();

    // Add participants to the newly created room
    await runtime.databaseAdapter.addParticipant(userA, room_id);
    await runtime.databaseAdapter.addParticipant(userB, room_id);
  } else {
    // If a room already exists, use the existing room
    room_id = rooms[0];
  }

  if (!relationship) {
    // Create the relationship
    await runtime.databaseAdapter.createRelationship({
      userA,
      userB,
    });

    relationship = await getRelationship({ runtime, userA, userB });

    if (!relationship) {
      throw new Error("Failed to fetch the created relationship");
    }
  }
  return { ...relationship, room_id: room_id };
}

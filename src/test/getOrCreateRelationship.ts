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
  try {
    let relationship = await getRelationship({ runtime, userA, userB });

    console.log("relationship", relationship);

    if (!relationship) {
      console.log("!relationship");
      // Check if a room already exists for the participants
      const rooms = await runtime.databaseAdapter.getRoomsByParticipants([
        userA,
        userB,
      ]);

      console.log("rooms", rooms);

      let roomId: UUID;

      if (!rooms || rooms.length === 0) {
        console.log("!rooms || rooms.length === 0");
        // If no room exists, create a new room for the relationship
        roomId = await runtime.databaseAdapter.createRoom("Direct Message");

        console.log("roomId", roomId);

        // Add participants to the newly created room
        console.log("adding parcitipants to room...");
        await runtime.databaseAdapter.addParticipantToRoom(userA, roomId);
        await runtime.databaseAdapter.addParticipantToRoom(userB, roomId);
        console.log("userA, userB", userA, userB);
      } else {
        // If a room already exists, use the existing room
        roomId = rooms[0];
      }

      console.log("createRelationship");
      // Create the relationship
      await runtime.databaseAdapter.createRelationship({
        userA,
        userB,
      });

      console.log("getRelationship");
      // Fetch the newly created relationship
      relationship = await getRelationship({ runtime, userA, userB });
      console.log("relationship", relationship);

      if (!relationship) {
        throw new Error("Failed to fetch the created relationship");
      }
    }
    return relationship;
  } catch (error) {
    throw new Error(`Error creating relationship: ${JSON.stringify(error)}`);
  }
}

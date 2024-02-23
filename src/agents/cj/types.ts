import { type UUID } from "crypto";

export interface Relationship {
  id: UUID;
  user_a: UUID;
  user_b: UUID;
  user_id: UUID;
  room_id: UUID;
  status: string;
  created_at?: string;
}

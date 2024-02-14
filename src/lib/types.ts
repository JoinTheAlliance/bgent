import { type UUID } from "crypto";
import { type BgentRuntime } from "./runtime";

export interface Relationship {
  id: UUID;
  user_a: UUID;
  user_b: UUID;
  user_id: UUID;
  room_id: UUID;
  status: string;
  created_at?: string;
}

export interface Content {
  content: string;
  action?: string;
}

export interface Actor {
  name: string;
  details: { tagline: string; summary: string; quote: string };
  id: UUID;
}

export interface Memory {
  id?: UUID;
  user_id: UUID;
  created_at?: string;
  content: Content | string;
  embedding?: number[];
  user_ids: UUID[];
  room_id: UUID;
}

export interface Objective {
  id: string;
  description: string;
  completed: boolean;
}

export interface Goal {
  id: UUID;
  user_ids: UUID[];
  user_id: UUID;
  name: string;
  status: string;
  objectives: Objective[];
}

export interface State {
  userIds: UUID[];
  senderId?: UUID;
  agentId?: UUID;
  room_id: UUID;
  agentName?: string;
  senderName?: string;
  actors: string;
  actorsData?: Actor[];
  goals?: string;
  goalsData?: Goal[];
  recentMessages: string;
  recentMessagesData: Memory[];
  recentReflections?: string;
  recentReflectionsData?: Memory[];
  relevantReflections?: string;
  relevantReflectionsData?: Memory[];
  actionNames?: string;
  actions?: string;
  actionsData?: Action[];
  messageExamples: string;
  responseData?: Content;
  [key: string]: unknown;
}

export interface Message {
  agentId: UUID;
  senderId: UUID;
  userIds: UUID[];
  content: Content | string;
  room_id: UUID;
}

export interface MessageExample {
  user: string;
  content: string | null;
  action: string | null;
}

export type Handler = (
  runtime: BgentRuntime,
  message: Message,
) => Promise<unknown>;

export type Validator = (
  runtime: BgentRuntime,
  message: Message,
  state?: State,
) => Promise<boolean>;

export interface Action {
  name: string;
  description: string;
  condition: string;
  examples: string[];
  validate: Validator;
  handler: Handler | undefined;
}

export interface Evaluator extends Action {}

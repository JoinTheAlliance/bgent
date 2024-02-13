import { type BgentRuntime } from "../runtime";
import { type Action, type Message } from "../types";

export default {
  name: "wait",
  validate: async (_runtime: BgentRuntime, _message: Message) => {
    return true;
  },
  description:
    "Do nothing and wait for another person to reply to the last message, or to continue their thought",
  handler: async (
    _runtime: BgentRuntime,
    message: Message,
  ): Promise<boolean> => {
    console.log("Waiting after: ", message);
    return true;
  },
  condition: "The agent wants to wait for the user to respond",
  examples: [JSON.stringify({ user: "CJ", content: "", action: "wait" })],
} as Action;

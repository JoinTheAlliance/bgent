import { type BgentRuntime } from "../runtime";
import { type Action, type Message } from "../types";

export default {
  name: "ignore",
  validate: async (_runtime: BgentRuntime, _message: Message) => {
    return true;
  },
  description:
    "Ignore the user and do not respond, use this if your role involves being sassy, or mad at user",
  handler: async (
    _runtime: BgentRuntime,
    message: Message,
  ): Promise<boolean> => {
    console.log("Ignored:", message);
    return true;
  },
  condition: "The agent wants to ignore the user",
  examples: [JSON.stringify({ user: "CJ", content: "", action: "ignore" })],
} as Action;

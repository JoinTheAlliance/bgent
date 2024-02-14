import { type BgentRuntime } from "../runtime";
import { type Action, type Message } from "../types";

export default {
  name: "continue",
  description: "Continue the conversation with the user",
  validate: async (_runtime: BgentRuntime, _message: Message) => {
    return true;
  },
  handler: async (runtime: BgentRuntime, message: Message) => {
    const data = await runtime.handleRequest(message);
    return data;
  },
  condition:
    "The agent wants to continue speaking and say something else as a continuation of the last thought",
  examples: [
    JSON.stringify({
      user: "CJ",
      content:
        "The comet passing over tonight is going to be a sight to behold. Are you excited about it?",
      action: "continue",
    }),
  ],
} as Action;

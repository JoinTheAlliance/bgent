import { type BgentRuntime } from "../lib/runtime";
import { Evaluator, type Message, type State } from "../lib/types";

async function handler(runtime: BgentRuntime, message: Message) {
  const state = (await runtime.composeState(message)) as State;
  return state;
}

export default {
  name: "TEST_EVALUATOR",
  validate: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runtime: BgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _message: Message,
  ): Promise<boolean> => {
    return await Promise.resolve(true);
  },
  description: "Test evaluator.",
  condition: "When we are evualating whether tests work.",
  handler,
  examples: [
    {
      context: "Testing, testing, 123 123",
      messages: [
        {
          user: "{{user1}}",
          content: "Testing, testing, 123 123",
          action: "TEST_EVALUATOR",
        },
      ],
      outcome: "There is an outcome.",
    },
  ],
} as Evaluator;

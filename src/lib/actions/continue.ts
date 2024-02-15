import { composeContext } from "../context";
import logger from "../logger";
import { type BgentRuntime } from "../runtime";
import { requestHandlerTemplate } from "../templates";
import { Content, State, type Action, type Message } from "../types";
import { parseJSONObjectFromText } from "../utils";

const maxContinuesInARow = 2;

export default {
  name: "CONTINUE",
  description:
    "Respond with this message, then write another immediately after. If the thought is done or you're waiting for a response, don't use this.",
  validate: async (runtime: BgentRuntime, message: Message, state: State) => {
    if (!state) state = await runtime.composeState(message);
    // get all of the messages that were from message.agentId from recentMessagesData in state
    const { recentMessagesData } = state;

    const agentMessages = recentMessagesData
      .filter((m) => m.user_id === message.agentId)
      .map((m) => (m as Content).action);

    // check if the last messages were all continues
    if (agentMessages) {
      const lastMessages = agentMessages.slice(-maxContinuesInARow);
      if (lastMessages.length === maxContinuesInARow) {
        const allContinues = lastMessages.every((m) => m === "CONTINUE");
        if (allContinues) {
          return false;
        }
      }
    }

    return true;
  },
  handler: async (runtime: BgentRuntime, message: Message, state: State) => {
    if (!state) {
      state = (await runtime.composeState(message)) as State;
    }

    const context = composeContext({
      state,
      template: requestHandlerTemplate,
    });

    if (runtime.debugMode) {
      logger.log(context, {
        title: "Continued Response Context",
        frame: true,
        color: "blue",
      });
    }

    let responseContent;
    const { senderId, room_id, userIds: user_ids, agentId } = message;

    for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
      const response = await runtime.completion({
        context,
        stop: [],
      });

      runtime.supabase
        .from("logs")
        .insert({
          body: { message, context, response },
          user_id: senderId,
          room_id,
          user_ids: user_ids!,
          agent_id: agentId!,
          type: "main_completion",
        })
        .then(({ error }) => {
          if (error) {
            console.error("error", error);
          }
        });

      const parsedResponse = parseJSONObjectFromText(response);
      if (parsedResponse?.user?.includes(state.agentName)) {
        responseContent = parsedResponse;
        break;
      }
    }

    if (!responseContent) {
      if (runtime.debugMode) {
        logger.log("No response content", {
          color: "red",
        });
      }
      return;
    }

    // prevent repetition
    const messageExists = state.recentMessagesData
      .filter((m) => m.user_id === message.agentId)
      .slice(-maxContinuesInARow)
      .some((m) => m.content === message.content);

    if (messageExists) {
      if (runtime.debugMode) {
        logger.log("Message already exists in recentMessagesData", {
          color: "red",
        });
      }
      return responseContent;
    }

    await runtime.saveResponseMessage(message, state, responseContent);
    await runtime.processActions(message, responseContent);

    return responseContent;
  },
  condition:
    "The agent wants to continue speaking and say something else as a continuation of the last thought",
  examples: [
    [
      {
        user: "{{user1}}",
        content:
          "Planning a solo trip soon. I've always wanted to try backpacking.",
      },
      {
        user: "{{user2}}",
        content: "Adventurous",
        action: "CONTINUE",
      },
      {
        user: "{{user2}}",
        content: "Any particular destination?",
        action: "WAIT",
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "I started learning the guitar this month!",
        action: "WAIT",
      },
      {
        user: "{{user2}}",
        content: "How’s that going?",
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: "Challenging, but rewarding.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: "My fingers hurt though.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: "Seriously lol it hurts to type",
        action: "WAIT",
      },
    ],

    [
      {
        user: "{{user1}}",
        content:
          "I've been summarying a lot on what happiness means to me lately.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: "That it’s more about moments than things.",
        action: "CONTINUE",
      },
      {
        user: "{{user2}}",
        content:
          "Like the best things that have ever happened were things that happened, or moments that I had with someone.",
        action: "CONTINUE",
      },
    ],

    [
      {
        user: "{{user1}}",
        content: "I found some incredible art today.",
        action: "WAIT",
      },
      {
        user: "{{user2}}",
        content: "Who's the artist?",
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: "Not sure lol, they are anon",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content:
          "But the pieces are just so insane looking. Once sec, let me grab a link.",
        action: "CONTINUE",
      },
    ],

    [
      {
        user: "{{user1}}",
        content:
          "The new exhibit downtown is thought-provoking. It's all about tribalism in online spaces.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: "Really challenges your perceptions. Highly recommend it!",
        action: "CONTINUE",
      },
      {
        user: "{{user2}}",
        content: "I’m in. When are you free to go?",
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: "Hmm, let me check.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: "How about this weekend?",
        action: "WAIT",
      },
    ],
  ],
} as Action;

import { composeContext } from "../context";
import logger from "../logger";
import { embeddingZeroVector } from "../memory";
import { type BgentRuntime } from "../runtime";
import { requestHandlerTemplate } from "../templates";
import { Content, State, type Action, type Message } from "../types";
import { parseJSONObjectFromText } from "../utils";

const maxContinuesInARow = 2;

export default {
  name: "CONTINUE",
  description:
    "ONLY use this action when the message necessitates a follow up. Do not use this when asking a question (use WAIT instead). Do not use this action when the conversation is finished or the user does not wish to speak (use IGNORE instead). If the last message was a continue, and the user has not responded, use WAIT instead. Use sparingly!",
  validate: async (runtime: BgentRuntime, message: Message) => {
    const recentMessagesData = await runtime.messageManager.getMemoriesByIds({
      userIds: message.userIds!,
      count: 10,
      unique: false,
    });
    const agentMessages = recentMessagesData.filter(
      (m) => m.user_id === message.agentId,
    );

    // check if the last messages were all continues=
    if (agentMessages) {
      const lastMessages = agentMessages.slice(0, maxContinuesInARow);
      if (lastMessages.length >= maxContinuesInARow) {
        const allContinues = lastMessages.every(
          (m) => (m.content as Content).action === "CONTINUE",
        );
        if (allContinues) {
          return false;
        }
      }
    }

    return true;
  },
  handler: async (runtime: BgentRuntime, message: Message, state: State) => {
    state = (await runtime.composeState(message)) as State;

    const context = composeContext({
      state,
      template: requestHandlerTemplate,
    });

    if (runtime.debugMode) {
      logger.log(context, "Continued Response Context", "cyan");
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

      const parsedResponse = parseJSONObjectFromText(
        response,
      ) as unknown as Content;
      if (
        (parsedResponse?.user as string).includes(state.agentName as string)
      ) {
        responseContent = parsedResponse;
        break;
      }
    }

    if (!responseContent) {
      if (runtime.debugMode) {
        logger.error("No response content");
      }
      return;
    }

    // prevent repetition
    const messageExists = state.recentMessagesData
      .filter((m) => m.user_id === message.agentId)
      .slice(0, maxContinuesInARow)
      .some((m) => m.content === message.content);

    if (messageExists) {
      if (runtime.debugMode) {
        logger.log(
          "Message already exists in recentMessagesData",
          "",
          "yellow",
        );
      }

      return responseContent;
    }

    const _saveResponseMessage = async (
      message: Message,
      state: State,
      responseContent: Content,
    ) => {
      const { agentId, userIds, room_id } = message;

      responseContent.content = responseContent.content?.trim();

      if (responseContent.content) {
        await runtime.messageManager.createMemory({
          user_ids: userIds!,
          user_id: agentId!,
          content: responseContent,
          room_id,
          embedding: embeddingZeroVector,
        });
        await runtime.evaluate(message, { ...state, responseContent });
      } else {
        console.warn("Empty response, skipping");
      }
    };

    await _saveResponseMessage(message, state, responseContent);

    // if the action is CONTINUE, check if we are over maxContinuesInARow
    // if so, then we should change the action to WAIT
    if (responseContent.action === "CONTINUE") {
      const agentMessages = state.recentMessagesData
        .filter((m) => m.user_id === message.agentId)
        .map((m) => (m.content as Content).action);

      const lastMessages = agentMessages.slice(0, maxContinuesInARow);
      if (lastMessages.length >= maxContinuesInARow) {
        const allContinues = lastMessages.every((m) => m === "CONTINUE");
        if (allContinues) {
          responseContent.action = "WAIT";
        }
      }
    }

    await runtime.processActions(message, responseContent);
    return responseContent;
  },
  condition:
    "The agent wants to continue speaking and say something else as a continuation of the last thought. If the conversation is done, the agent is waiting for the user to respond, or the user does not want to continue, do not use the continue action.",
  examples: [
    [
      {
        user: "{{user1}}",
        content:
          "Planning a solo trip soon. I've always wanted to try backpacking.",
      },
      {
        user: "{{user2}}",
        content: { content: "Adventurous" },
        action: "CONTINUE",
      },
      {
        user: "{{user2}}",
        content: { content: "Any particular destination?" },
        action: "WAIT",
      },
    ],

    [
      {
        user: "{{user1}}",
        content: { content: "I started learning the guitar this month!" },
        action: "WAIT",
      },
      {
        user: "{{user2}}",
        content: { content: "How’s that going?" },
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: { content: "Challenging, but rewarding." },
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: { content: "Seriously lol it hurts to type" },
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
        content: {
          content: "That it’s more about moments than things.",
          action: "CONTINUE",
        },
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
        content: { content: "I found some incredible art today." },
        action: "WAIT",
      },
      {
        user: "{{user2}}",
        content: { content: "Who's the artist?" },
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: { content: "Not sure lol, they are anon" },
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content:
          "But the pieces are just so insane looking. Once sec, let me grab a link.",
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: { content: "DMed it to you" },
        action: "WAIT",
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
        content: {
          content: "Really challenges your perceptions. Highly recommend it!",
          action: "CONTINUE",
        },
      },
      {
        user: "{{user2}}",
        content: { content: "I’m in. When are you free to go?" },
        action: "WAIT",
      },
      {
        user: "{{user1}}",
        content: { content: "Hmm, let me check." },
        action: "CONTINUE",
      },
      {
        user: "{{user1}}",
        content: { content: "How about this weekend?" },
        action: "WAIT",
      },
    ],
  ],
} as Action;

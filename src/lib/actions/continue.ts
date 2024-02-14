import { composeContext } from "../context";
import logger from "../logger";
import { type BgentRuntime } from "../runtime";
import { requestHandlerTemplate } from "../templates";
import { Content, State, type Action, type Message } from "../types";
import { parseJSONObjectFromText } from "../utils";

const maxContinuesInARow = 3;

export default {
  name: "continue",
  description: "Continue the conversation with the user",
  validate: async (runtime: BgentRuntime, message: Message, state: State) => {
    if (!state) state = await runtime.composeState(message);
    // get all of the messages that were from message.agentId from recentMessagesData in state
    const { recentMessagesData } = state;

    const agentMessages = recentMessagesData.filter(
      (m) => m.user_id === message.agentId,
    ).map((m) => (m as Content).action);

    // check if the last messages were all continues
    if (agentMessages) {
      const lastMessages = agentMessages.slice(-maxContinuesInARow);
      if (lastMessages.length === maxContinuesInARow) {
        const allContinues = lastMessages.every((m) => m === "continue");
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
    JSON.stringify({
      user: "CJ",
      content:
        "The comet passing over tonight is going to be a sight to behold. Are you excited about it?",
      action: "continue",
    }),
  ],
} as Action;

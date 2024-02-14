import { type Content, type Memory, type State } from "./types";

export function shouldSkipMessage(state: State, agentId: string): boolean {
  if (state.recentMessagesData && state.recentMessagesData.length > 2) {
    const currentMessages = state.recentMessagesData ?? [];
    const lastThreeMessages = currentMessages.slice(-3);
    const lastThreeMessagesFromAgent = lastThreeMessages.filter(
      (message: Memory) => message.user_id === agentId,
    );
    if (lastThreeMessagesFromAgent.length === 3) {
      return true;
    }

    const lastTwoMessagesFromAgent = lastThreeMessagesFromAgent.slice(-2);
    const lastTwoMessagesFromAgentWithWaitAction =
      lastTwoMessagesFromAgent.filter(
        (message: Memory) => (message.content as Content).action === "wait",
      );
    if (lastTwoMessagesFromAgentWithWaitAction.length === 2) {
      return true;
    }
  }
  return false;
}

export function parseJsonArrayFromText(text: string) {
  let jsonData = null;

  const jsonBlockPattern = /```json\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockPattern);

  if (jsonBlockMatch) {
    try {
      jsonData = JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      return null;
    }
  } else {
    const arrayPattern = /\[\s*{[\s\S]*?}\s*\]/;
    const arrayMatch = text.match(arrayPattern);

    if (arrayMatch) {
      try {
        jsonData = JSON.parse(arrayMatch[0]);
      } catch (e) {
        return null;
      }
    }
  }

  if (
    Array.isArray(jsonData) &&
    jsonData.every(
      (item) => typeof item === "object" && "claim" in item && "type" in item,
    )
  ) {
    return jsonData;
  } else {
    return null;
  }
}

export function parseJSONObjectFromText(text: string) {
  let jsonData = null;

  const jsonBlockPattern = /```json\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockPattern);

  if (jsonBlockMatch) {
    try {
      jsonData = JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      return null;
    }
  } else {
    const objectPattern = /{[\s\S]*?}/;
    const objectMatch = text.match(objectPattern);

    if (objectMatch) {
      try {
        jsonData = JSON.parse(objectMatch[0]);
      } catch (e) {
        return null;
      }
    }
  }

  if (
    typeof jsonData === "object" &&
    jsonData !== null &&
    !Array.isArray(jsonData)
  ) {
    return jsonData;
  } else if (typeof jsonData === "object" && Array.isArray(jsonData)) {
    return parseJsonArrayFromText(text);
  } else {
    return null;
  }
}

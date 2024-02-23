import { composeContext } from "../context";
import logger from "../logger";
import { formatActors, getActorDetails } from "../messages";
import { type BgentRuntime } from "../runtime";
import {
  Content,
  Memory,
  type Action,
  type Actor,
  type Message,
  type State,
} from "../types";
import { parseJsonArrayFromText } from "../utils";

export const formatSummarizations = (summarizations: Memory[]) => {
  const messageStrings = summarizations
    .reverse()
    .map(
      (summarization: Memory) =>
        `${(summarization.content as Content)?.content ?? (summarization.content as string)}`,
    );
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

const template = `TASK: Fact Summarization
Extract what happened in the scene as an array of claims in JSON format.

# START OF EXAMPLES
These are an examples of the expected output of this task:
{{evaluationExamples}}
# END OF EXAMPLES

Note: The above is examples of how to perform the task (fewshot). DO NOT USE for the actual task.

Below is the information that will be used for the task.

# INSTRUCTIONS

Extract any claims from the conversation in the ACTUAL scene that are not already present in the list of facts.
- If the fact is already in the character's description, set in_bio to true
- If the fact is already known to the character, set already_known to true
- Set the type to 'fact' or 'opinion'
- For facts, set the type to 'fact'
- For non-facts, set the type to 'opinion'
- Facts are always true, facts about the world or the character that do not change
- 'opinion' inlcudes non-factual opinions and also includes the character's thoughts, feelings, judgments or recommendations
- Ignore the examples when considering facts
- Include any factual detail, including where the user lives, works, or goes to school, what they do for a living, their hobbies, and any other relevant information

# START OF ACTUAL TASK INFORMATION

Facts about the actors:
{{recentSummarizations}}
{{relevantSummarizations}}

Actors in the Scene:
{{actors}}

Scene Dialog:
\`\`\`json
{{recentMessages}}
\`\`\`

INSTRUCTIONS: Extract ALL claims from the conversation in the scene that are not already present in the list of facts.

Response should be a JSON object array inside a JSON markdown block. Correct response format:
\`\`\`json
[
  {claim: string, type: enum<fact|opinion>, in_bio: boolean, already_known: boolean },
  {claim: string, type: enum<fact|opinion>, in_bio: boolean, already_known: boolean },
  ...
]
\`\`\``;

async function handler(runtime: BgentRuntime, message: Message) {
  const state = (await runtime.composeState(message)) as State;

  const { userIds, senderId, agentId, room_id } = state;

  const actors = (await getActorDetails({ runtime, userIds })) ?? [];

  const senderName = actors?.find(
    (actor: Actor) => actor.id === senderId,
  )?.name;

  const agentName = actors?.find((actor: Actor) => actor.id === agentId)?.name;

  const actionNames = runtime.actions.map((a: Action) => a.name).join(", ");
  console.log("actionNames", actionNames);

  const actions = runtime.actions
    .map((a: Action) => `${a.name}: ${a.description}`)
    .join("\n");

  const context = composeContext({
    state: {
      ...state,
      senderName,
      agentName,
      actors: formatActors({ actors }),
      actionNames,
      actions,
    },
    template,
  });

  // if (runtime.debugMode) {
  logger.log("*** Summarization context:\n" + context);
  // }

  let summarizations = null;

  for (let i = 0; i < 3; i++) {
    const summarizationText: string = await runtime.completion({
      context,
      stop: [],
    });
    console.log("summarizationText", summarizationText);
    const parsedSummarizations = parseJsonArrayFromText(summarizationText);
    if (parsedSummarizations) {
      summarizations = parsedSummarizations;
      break;
    }
  }

  if (!summarizations) {
    if (runtime.debugMode) {
      logger.warn("No summarization generated");
    }
    return [];
  }

  if (runtime.debugMode) {
    logger.log("*** Summarization Output:\n" + JSON.stringify(summarizations));
  }

  const filteredSummarizations = summarizations
    .filter((summarization) => {
      return (
        !summarization.already_known &&
        summarization.type === "fact" &&
        !summarization.in_bio &&
        summarization.claim &&
        summarization.claim.trim() !== ""
      );
    })
    .map((summarization) => summarization.claim);

  for (const summarization of filteredSummarizations) {
    const summarizationMemory =
      await runtime.summarizationManager.addEmbeddingToMemory({
        user_ids: userIds,
        user_id: agentId!,
        content: summarization,
        room_id,
      });

    await runtime.summarizationManager.createMemory(summarizationMemory, true);

    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return filteredSummarizations;
}

export default {
  name: "SUMMARIZE",
  validate: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runtime: BgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: Message,
  ): Promise<boolean> => {
    const messageCount = (await runtime.messageManager.countMemoriesByUserIds(
      message.userIds,
    )) as number;

    const reflectionCount = Math.ceil(runtime.getRecentMessageCount() / 2);

    return messageCount % reflectionCount === 0;
  },
  description:
    "Extract factual information about the people in the conversation, the current events in the world, and anything else that might be important to remember.",
  condition:
    "New factual information was revealed in the recent conversation which should be remembered.",
  handler,
  examples: [
    {
      context: `Actors in the scene:
{{user1}}: Programmer and moderator of the local story club.
{{user2}}: New member of the club. Likes to write and read.

Facts about the actors:
None`,
      messages: [
        {
          user: "{{user1}}",
          content: "So where are you from?",
          action: "WAIT",
        },
        {
          user: "{{user2}}",
          content: "I'm from the city.",
        },
        {
          user: "{{user1}}",
          content: "Which city?",
        },
        {
          user: "{{user2}}",
          content: "Oakland",
        },
        {
          user: "{{user1}}",
          content: "Oh, I've never been there, but I know it's in California!",
        },
      ],
      outcome: `{ "claim": "{{user1}} is from Oakland", "type": "fact", "in_bio": false, "already_known": false },`,
    },
    {
      context: `Actors in the scene:
{{user1}}: Athelete and cyclist. Worked out every day for a year to prepare for a marathon.
{{user2}}: Likes to go to the beach and shop.

Facts about the actors:
{{user1}} and {{user2}} are talking about the marathon
{{user1}} and {{user2}} have just started dating`,
      messages: [
        {
          user: "{{user1}}",
          content: "I finally completed the marathon this year!",
        },
        {
          user: "{{user2}}",
          content: "Wow! How long did it take?",
        },
        {
          user: "{{user1}}",
          content: "A little over three hours.",
        },
        {
          user: "{{user1}}",
          content: "I'm so proud of myself.",
        },
      ],
      outcome: `Claims:
json\`\`\`
[
  { "claim": "Alex just completed a marathon in just under 4 hours.", "type": "fact", "in_bio": false, "already_known": false },
  { "claim": "Alex worked out 2 hours a day at the gym for a year.", "type": "fact", "in_bio": true, "already_known": false },
  { "claim": "Alex is really proud of himself.", "type": "opinion", "in_bio": false, "already_known": false }
]
\`\`\`
`,
    },
    {
      context: `Actors in the scene:
{{user1}}: Likes to play poker and go to the park. Friends with Eva.
{{user2}}: Also likes to play poker. Likes to write and read.

Facts about the actors:
Mike and Eva won a regional poker tournament about six months ago
Mike is married to Alex
Eva studied Philosophy before switching to Computer Science`,
      messages: [
        {
          user: "{{user1}}",
          content:
            "Remember when we won the regional poker tournament last spring?",
        },
        {
          user: "{{user2}}",
          content: "Of course! That was an incredible day.",
        },
        {
          user: "{{user1}}",
          content: "It really put our poker club on the map.",
        },
      ],
      outcome: `Claims:
json\`\`\`
[
  { "claim": "Mike and Eva won the regional poker tournament last spring", "type": "fact", "in_bio": false, "already_known": true },
  { "claim": "Winning the regional poker tournament put the poker club on the map", "type": "opinion", "in_bio": false, "already_known": false }
]
\`\`\``,
    },
  ],
};

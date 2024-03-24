import { composeContext } from "../context";
import logger from "../logger";
import { type BgentRuntime } from "../runtime";
import { ActionExample, Content, Memory, type Message } from "../types";
import { parseJsonArrayFromText } from "../utils";

export const formatFacts = (facts: Memory[]) => {
  const messageStrings = facts
    .reverse()
    .map((fact: Memory) => `${(fact.content as Content)?.content}`);
  const finalMessageStrings = messageStrings.join("\n");
  return finalMessageStrings;
};

const template = `TASK: Fact Fact
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

{{recentFacts}}
{{relevantFacts}}
{{actors}}
{{recentMessages}}

INSTRUCTIONS: Extract ALL claims from the conversation in the scene that are not already present in the list of facts.

Response should be a JSON object array inside a JSON markdown block. Correct response format:
\`\`\`json
[
  {"claim": string, "type": enum<fact|opinion>, in_bio: boolean, already_known: boolean },
  {"claim": string, "type": enum<fact|opinion>, in_bio: boolean, already_known: boolean },
  ...
]
\`\`\``;

async function handler(runtime: BgentRuntime, message: Message) {
  const state = await runtime.composeState(message);

  const { agentId, room_id } = state;

  const context = composeContext({
    state,
    template,
  });

  if (runtime.debugMode) {
    logger.log(context, "Fact context", "cyan");
  }

  let facts;

  for (let i = 0; i < 3; i++) {
    const factText: string = await runtime.completion({
      context,
      stop: [],
    });
    const parsedFacts = parseJsonArrayFromText(factText);
    if (parsedFacts) {
      facts = parsedFacts;
      break;
    }
    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!facts) {
    if (runtime.debugMode) {
      logger.warn("No fact generated");
    }
    return [];
  }

  if (runtime.debugMode) {
    logger.log(JSON.stringify(facts), "Fact Output", "cyan");
  }

  const filteredFacts = facts
    .filter((fact) => {
      return (
        !fact.already_known &&
        fact.type === "fact" &&
        !fact.in_bio &&
        fact.claim &&
        fact.claim.trim() !== ""
      );
    })
    .map((fact) => fact.claim);

  for (const fact of filteredFacts) {
    const factMemory = await runtime.factManager.addEmbeddingToMemory({
      user_id: agentId!,
      content: { content: fact },
      room_id,
    });

    await runtime.factManager.createMemory(factMemory, true);

    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return filteredFacts;
}

export default {
  name: "GET_FACTS",
  validate: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runtime: BgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: Message,
  ): Promise<boolean> => {
    const messageCount = (await runtime.messageManager.countMemories(
      message.room_id,
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
          content: { content: "So where are you from?", action: "WAIT" },
        },
        {
          user: "{{user2}}",
          content: { content: "I'm from the city." },
        },
        {
          user: "{{user1}}",
          content: { content: "Which city?" },
        },
        {
          user: "{{user2}}",
          content: { content: "Oakland" },
        },
        {
          user: "{{user1}}",
          content: {
            content:
              "Oh, I've never been there, but I know it's in California!",
          },
        },
      ] as ActionExample[],
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
          content: { content: "I finally completed the marathon this year!" },
        },
        {
          user: "{{user2}}",
          content: { content: "Wow! How long did it take?" },
        },
        {
          user: "{{user1}}",
          content: { content: "A little over three hours." },
        },
        {
          user: "{{user1}}",
          content: { content: "I'm so proud of myself." },
        },
      ] as ActionExample[],
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
          content: {
            content:
              "Remember when we won the regional poker tournament last spring?",
          },
        },
        {
          user: "{{user2}}",
          content: { content: "Of course! That was an incredible day." },
        },
        {
          user: "{{user1}}",
          content: { content: "It really put our poker club on the map." },
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

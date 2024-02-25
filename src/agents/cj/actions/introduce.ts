import { type BgentRuntime } from "../../../lib";
import { composeContext } from "../../../lib/context";
import { createRelationship } from "../../../lib/relationships";
import { Action, type Message, type State } from "../../../lib/types";
import { parseJSONObjectFromText } from "../../../lib/utils";

const template = `## Example input:
Agent's Rolodex:
- Jamie: Loves music, and especially loves playing guitar hero
- Mike: Plays Starcraft 2 and likes to talk about it
- Lucius: Big fan of tweeting about the latest tech news

Current Actors in the scene
- Agent: A test agent who is being evluated for their ability to connect users
- Kyle: Like to listen to heavy metal music, and also plays Guitar Hero

Recent conversation:
Kyle: Hey, Agent, can you help me meet someone who likes heavy metal music?

## Example output:
Based on the recent conversation and the information provided, it seems like there is a potential connection that could be made between Kyle from the current scene and Jamie from CJ's rolodex:
Brief explanation: Kyle mentioned his interest in heavy metal music and playing Guitar Hero, and Jamie from CJ's rolodex loves music and especially enjoys playing Guitar Hero.
\`\`\`json
{ "userA": "Kyle", "userB": "Jamie" }
\`\`\`

You are deciding whether {{agentName}} should make a connection between a user in the current scene and one of the users in their rolodex.
Your goal is to evaluate if a connection should be made, and which users should be connected.

The response format should be this:
"""
<Brief explanation of why they should be connected>

\`\`\`json
{ userA: <name>, userB: <name> }
\`\`\`
"""

{{recentMessages}}

Users in the current scene:
{{actors}}

{{agentName}}'s rolodex:
{{relevantRelationships}}

First, using the most recent conversation, evaluate if any users in the scene should be connected to anyone from {{agentName}}'s rolodex.

Then respond with a JSON object containing a field for userA (the user in the scene) and userB (the user in the rolodex)

in a JSON block formatted for markdown with this structure
\`\`\`json
{ userA: <name>, userB: <name> }
\`\`\`

Your response must include the explanation and JSON block. If you do not think that a connection should made, do not include a JSON block.`;

const handler = async (runtime: BgentRuntime, message: Message) => {
  const state = (await runtime.composeState(message)) as State;

  const context = composeContext({
    state,
    template,
  });

  let responseData = null;
  for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
    const response = await runtime.completion({
      context,
      stop: [],
    });

    const parsedResponse = parseJSONObjectFromText(response);

    if (parsedResponse) {
      responseData = parsedResponse;
      break;
    }

    if (runtime.debugMode) {
      console.log(`introduceHandler response: ${response}`);
    }
  }

  if (responseData?.userA && responseData.userB) {
    await createRelationship({
      runtime,
      userA: responseData.userA,
      userB: responseData.userB,
    });
  } else if (runtime.debugMode) {
    console.log("No connection made, could not parse response");
  }
};

export default {
  name: "INTRODUCE",
  validate: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runtime: BgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _message: Message,
  ): Promise<boolean> => {
    return await Promise.resolve(true);
  },
  description:
    "Introduce the user to someone from the rolodex who they might like to chat with. Only use this if the user is expressing interest in meeting someone new. If the user has not expressed interest, DO NOT USE THIS ACTION.",
  handler,
  condition:
    "The agent wants to introduce the user to someone from the rolodex",
  examples: [],
} as Action;

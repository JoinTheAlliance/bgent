import { type BgentRuntime } from "../../../lib";
import { composeContext } from "../../../lib/context";
import { createRelationship } from "../../../lib/relationships";
import { Action, type Message, type State } from "../../../lib/types";
import { parseJSONObjectFromText } from "../../../lib/utils";

const template = `You are taking the role of {{agentName}} in a scene. {{agentName}} might want to make a connection between a user in the current scene and one of the users in their rolodex.
Your goal is to evaluate if a connection should be made, and which users should be connected.

The response format should be this:
"""
<Brief explanation of why they should be connected>

\`\`\`json
{ userA: <name>, userB: <name> }
\`\`\`
"""

Recent conversation:
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

Your response must include the explanation and JSON block. If you do not think that a connection should made, do not include a JSON block.

##Example input:
[[agentName]] = CJ

Recent conversation:
'''
Tom: Hey, CJ, you know what's great? My reflection. It's almost as charming as me!
CJ: Haha, you do have quite the charisma. Speaking of charisma, Kyle, I heard you're a fan of heavy metal music.
Kyle: Absolutely! I can't get enough of it. I even play guitar hero sometimes.
'''

Rolodex:
- Cynthia: Loves music, and especially loves playing guitar hero
- Mark: Plays League of Legends
- Gojo: Likes to say out-of-pocket stuff like "Nah I'd win", "With this treasure i summon"

[[actors]]
- Tom: Narcissistic guy who's obsessed with his looks
- Kyle: Like to listen to heavy metal music, and also plays Guitar Hero

##Example output:

Based on the recent conversation and the information provided, it seems like there is a potential connection that could be made between Kyle from the current scene and Cynthia from CJ's rolodex:

Brief explanation: Kyle mentioned his interest in heavy metal music and playing Guitar Hero, and Cynthia from CJ's rolodex loves music and especially enjoys playing Guitar Hero.
{ "userA": "Kyle", "userB": "Cynthia" }
`;

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
      supabase: runtime.supabase,
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
    _runtime: BgentRuntime,
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

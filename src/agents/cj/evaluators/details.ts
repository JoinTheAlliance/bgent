import { type BgentRuntime } from "../../../lib";
import { composeContext } from "../../../lib/context";
import { type Evaluator, type Message, type State } from "../../../lib/types";
import { parseJSONObjectFromText } from "../../../lib/utils";

const template = `You are collecting details about {{senderName}} based on their ongoing conversation with {{agentName}}.

{{recentMessages}}

Using the most recent conversation, get the details for the user's name, age, location and gender.
Only include the values that can be extracted from the conversation.
Then respond with a JSON object containing a field for description in a JSON block formatted for markdown with this structure:
\`\`\`json
{ name?: string, age?: number, location?: string, gender?: string}
\`\`\`

Your response must include the JSON block.`;

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
      if (runtime.debugMode) {
        console.log("got response", responseData);
      }
      break;
    }

    if (runtime.debugMode) {
      console.log(`UPDATE_PROFILE response: ${response}`);
    }
  }

  if (!responseData) {
    if (runtime.debugMode) {
      console.log("Could not parse response");
    }
    return;
  }

  const { name, age, location, gender } = responseData;

  const response = await runtime.supabase
    .from("accounts")
    .select("*")
    .eq("id", message.senderId)
    .single();
  const { data: userRecord, error } = response;
  if (error) {
    console.error("error getting user", error);
  }

  const currentDetails = userRecord.details || {};

  if (name && !currentDetails.name) {
    currentDetails.name = name;
  }

  if (age && !currentDetails.age) {
    currentDetails.age = age;
  }

  if (location && !currentDetails.location) {
    currentDetails.location = location;
  }

  if (gender && !currentDetails.gender) {
    currentDetails.gender = gender;
  }

  const { error: updateError } = await runtime.supabase
    .from("accounts")
    .update({ details: currentDetails })
    .eq("id", userRecord.id);
  if (updateError) {
    console.error("error updating user", updateError);
  }

  return {
    name,
    age,
    location,
    gender,
  };
};

export default {
  name: "UPDATE_DETAILS",
  validate: async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _runtime: BgentRuntime,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _message: Message,
  ): Promise<boolean> => {
    return await Promise.resolve(true);
  },
  description:
    "Update the details of the user using information collected from the conversation.",
  condition:
    "The user has mentioned where they live, how old they are and what gender they are.",
  handler,
  examples: [],
} as Evaluator;

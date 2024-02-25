import { composeContext } from "../context";
import { getGoals } from "../goals";
import { type BgentRuntime } from "../runtime";
import { type Goal, type Message, type State } from "../types";
import { parseJsonArrayFromText } from "../utils";

const template = `TASK: Update Goal
Analyze the conversation and update the status of the goals based on the new information provided.

# INSTRUCTIONS

- Review the conversation and identify any progress towards the objectives of the current goals.
- Update the status of the goal to 'DONE' if all objectives are completed.
- If progress is made but the goal is not fully completed, update the status to 'IN_PROGRESS'.
- If no progress is made, do not change the status of the goal.

# START OF ACTUAL TASK INFORMATION

{{goals}}
{{recentMessages}}

TASK: Analyze the conversation and update the status of the goals based on the new information provided. Respond with a JSON array of goals to update.
- Each item must include the goal ID, as well as the fields in the goal to update.
- For updating objectives, include the entire objectives array including unchanged fields.
- Only include goals which need to be updated.

Response format should be:
\`\`\`json
[
  {
    "id": <goal uuid>,
    ...additionalProperties
  }
]
\`\`\``;

async function handler(
  runtime: BgentRuntime,
  message: Message,
): Promise<Goal[]> {
  const state = (await runtime.composeState(message)) as State;

  const goalsData = await getGoals({
    runtime,
    count: 10,
    onlyInProgress: true,
    userIds: state.userIds,
  });

  const context = composeContext({
    state: {
      ...state,
      goals: JSON.stringify(goalsData, null, 2), // Formatting goals data for the context
    },
    template,
  });

  // Request completion from OpenAI to analyze conversation and suggest goal updates
  const response = await runtime.completion({
    context,
    stop: [],
  });

  // Parse the JSON response to extract goal updates
  const updates = parseJsonArrayFromText(response);

  // Apply the updates to the goals
  const updatedGoals = goalsData.map((goal: Goal) => {
    const update = updates?.find((u) => u.id === goal.id);
    if (update) {
      return { ...goal, ...update }; // Merging the update into the existing goal
    }
    return goal; // No update for this goal
  });

  // Update goals in the database
  for (const goal of updatedGoals) {
    await runtime.supabase
      .from("goals")
      .update({ status: goal.status })
      .match({ id: goal.id });
  }

  return updatedGoals; // Return updated goals for further processing or logging
}

export default {
  name: "UPDATE_GOAL",
  validate: async (
    runtime: BgentRuntime,
    message: Message,
  ): Promise<boolean> => {
    // Check if there are active goals that could potentially be updated
    const goals = await getGoals({
      runtime,
      count: 1,
      onlyInProgress: true,
      userIds: message.userIds,
    });
    return goals.length > 0;
  },
  description:
    "Analyze the conversation and update the status of the goals based on the new information provided.",
  condition:
    "The conversation provides new information relevant to the current goals.",
  handler,
};

import { composeContext } from "../context";
import { getGoals } from "../goals";
import { type BgentRuntime } from "../runtime";
import { type Goal, type Message, type State } from "../types";
import { parseJsonArrayFromText } from "../utils";

const template = `TASK: Update Goal
Analyze the conversation and update the status of the goals based on the new information provided.

# INSTRUCTIONS

- Review the conversation and identify any progress towards the objectives of the current goals.
- Update the objectives if they have been completed or if there is new information about them.
- Update the status of the goal to 'DONE' if all objectives are completed.
- If no progress is made, do not change the status of the goal.

- Goal status options are 'IN_PROGRESS', 'DONE' and 'FAILED'. If the goal is active it should always be 'IN_PROGRESS'.

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
    "id": <goal uuid>, // required
    "status": "IN_PROGRESS" | "DONE" | "FAILED", // optional
    "objectives": [ // optional
      { "description": "Objective description", "completed": true | false },
      { "description": "Objective description", "completed": true | false }
    ] // NOTE: If updating objectives, include the entire objectives array including unchanged fields.
  }
]
\`\`\``;

async function handler(
  runtime: BgentRuntime,
  message: Message,
): Promise<Goal[]> {
  // get goals
  let goalsData = await getGoals({
    runtime,
    userIds: message.userIds,
    onlyInProgress: false,
  });

  const state = (await runtime.composeState(message)) as State;
  const context = composeContext({
    state,
    template,
  });

  console.log("**** context");
  console.log(context);

  // Request completion from OpenAI to analyze conversation and suggest goal updates
  const response = await runtime.completion({
    context,
    stop: [],
  });

  console.log("response");
  console.log(response);

  // Parse the JSON response to extract goal updates
  const updates = parseJsonArrayFromText(response);

  console.log("*** updates", updates);

  // get goals
  goalsData = await getGoals({
    runtime,
    userIds: message.userIds,
    onlyInProgress: true,
  });

  // Apply the updates to the goals
  const updatedGoals = goalsData
    .map((goal: Goal) => {
      const update = updates?.find((u) => u.id === goal.id);
      if (update) {
        return { ...goal, ...update }; // Merging the update into the existing goal
      }
      return null; // No update for this goal
    })
    .filter(Boolean);

  // Update goals in the database
  for (const goal of updatedGoals) {
    const result = await runtime.supabase
      .from("goals")
      .update({ ...goal })
      .match({ id: goal.id });
    console.log("result", result);
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
  examples: [
    {
      context: `Actors in the scene:
  {{user1}}: An avid reader and member of a book club.
  {{user2}}: The organizer of the book club.
  
  Goals:
  - Name: Finish reading "War and Peace"
    Status: IN_PROGRESS
    Objectives: 
      - Read up to chapter 20 by the end of the month
      - Discuss the first part in the next meeting`,

      messages: [
        {
          user: "{{user1}}",
          content: {
            content: "I've just finished chapter 20 of 'War and Peace'!",
          },
        },
        {
          user: "{{user2}}",
          content: {
            content:
              "That's great! Were you able to grasp the complexities of the characters?",
          },
        },
        {
          user: "{{user1}}",
          content: {
            content: "Yes, I've prepared some notes for our discussion.",
          },
        },
      ],

      outcome: `[
        {
          "id": "<goal uuid for 'Finish reading War and Peace'>",
          "objectives": [
            { "description": "Read up to chapter 20 by the end of the month", "completed": true },
            { "description": "Discuss the first part in the next meeting", "completed": false }
          ]
        }
      ]`,
    },

    {
      context: `Actors in the scene:
  {{user1}}: A fitness enthusiast working towards a marathon.
  {{user2}}: A personal trainer.
  
  Goals:
  - Name: Complete a marathon
    Status: IN_PROGRESS
    Objectives: 
      - Increase running distance to 30 miles a week
      - Complete a half-marathon as practice`,

      messages: [
        {
          user: "{{user1}}",
          content: { content: "I managed to run 30 miles this week!" },
        },
        {
          user: "{{user2}}",
          content: {
            content:
              "Impressive progress! How do you feel about the half-marathon next month?",
          },
        },
        {
          user: "{{user1}}",
          content: { content: "I feel confident. The training is paying off." },
        },
      ],

      outcome: `[
        {
          "id": "<goal uuid for 'Complete a marathon'>",
          "objectives": [
            { "description": "Increase running distance to 30 miles a week", "completed": true },
            { "description": "Complete a half-marathon as practice", "completed": false }
          ]
        }
      ]`,
    },

    {
      context: `Actors in the scene:
  {{user1}}: A student working on a final year project.
  {{user2}}: The project supervisor.
  
  Goals:
  - Name: Finish the final year project
    Status: IN_PROGRESS
    Objectives: 
      - Submit the first draft of the thesis
      - Complete the project prototype`,

      messages: [
        {
          user: "{{user1}}",
          content: { content: "I've submitted the first draft of my thesis." },
        },
        {
          user: "{{user2}}",
          content: { content: "Well done. How is the prototype coming along?" },
        },
        {
          user: "{{user1}}",
          content: {
            content:
              "It's almost done. I just need to finalize the testing phase.",
          },
        },
      ],

      outcome: `[
        {
          "id": "<goal uuid for 'Finish the final year project'>",
          "objectives": [
            { "description": "Submit the first draft of the thesis", "completed": true },
            { "description": "Complete the project prototype", "completed": false }
          ]
        }
      ]`,
    },
  ],
};

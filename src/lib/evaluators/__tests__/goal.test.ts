import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import { getOrCreateRelationship } from "../../../test/getOrCreateRelationship";
import { populateMemories } from "../../../test/populateMemories";
import { runAiTest } from "../../../test/runAiTest";
import { type User } from "../../../test/types";
import { defaultActions } from "../../actions";
import { zeroUuid } from "../../constants";
import { createGoal, getGoals } from "../../goals";
import { type BgentRuntime } from "../../runtime";
import { Goal, GoalStatus, Objective, type Message } from "../../types";
import evaluator from "../goal";

dotenv.config({ path: ".dev.vars" });

describe("Goals Evaluator", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      evaluators: [evaluator],
      actions: defaultActions,
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getOrCreateRelationship({
      runtime,
      userA: user.id as UUID,
      userB: zeroUuid,
    });

    if (!data) {
      throw new Error("Relationship not found");
    }

    room_id = data.room_id;

    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  async function cleanup() {
    // delete all goals for the user
    await runtime.databaseAdapter.removeAllMemories(room_id, "goals");
  }

  async function createTestGoal(name: string, objectives: Objective[]) {
    const result = await createGoal({
      runtime,
      goal: {
        name,
        status: GoalStatus.IN_PROGRESS,
        room_id,
        user_id: user.id as UUID,
        objectives,
      },
    });
    return result;
  }

  test("Update goal objectives based on conversation", async () => {
    await runAiTest(
      "Update goal objectives based on conversation",
      async () => {
        await cleanup();

        await createTestGoal("Test Goal", [
          { description: "Complete task 1", completed: false },
          { description: "Complete task 2", completed: false },
        ]);

        // Simulate a conversation indicating failure to achieve "Goal Y"
        const conversation = (user_id: UUID) => [
          {
            user_id,
            content: { content: "I see that you've finished the task?" },
          },
          {
            user_id: zeroUuid,
            content: {
              content: "Yes, the task and all objectives are finished.",
            },
          },
        ];

        await populateMemories(runtime, user, room_id, [conversation]);

        // Simulate a conversation indicating the completion of both objectives
        const message: Message = {
          userId: user.id as UUID,
          content: {
            content:
              "I've completed task 1 and task 2 for the Test Goal. Both are finished. Everything is done and I'm ready for the next goal.",
          },
          room_id,
        };

        const state = await runtime.composeState(message);

        // Process the message with the goal evaluator
        await evaluator.handler(runtime, message, state);

        // Fetch the updated goal to verify the objectives and status were updated
        const updatedGoals = await getGoals({
          runtime,
          room_id,
          onlyInProgress: false,
        });

        const updatedTestGoal = updatedGoals.find(
          (goal: Goal) => goal.name === "Test Goal",
        );

        return (
          updatedTestGoal !== undefined &&
          updatedTestGoal.status === GoalStatus.DONE &&
          updatedTestGoal.objectives.every((obj: Objective) => obj.completed)
        );
      },
    );
  }, 60000);

  test("Goal status updated to FAILED based on conversation", async () => {
    await runAiTest(
      "Goal status updated to FAILED based on conversation",
      async () => {
        await cleanup();
        // Preparing the test goal "Goal Y"
        await createTestGoal("Goal Y", [
          { description: "Complete all tasks for Goal Y", completed: false },
        ]);

        // Simulate a conversation indicating failure to achieve "Goal Y"
        const conversation = (user_id: UUID) => [
          {
            user_id,
            content: { content: "I couldn't complete the tasks for Goal Y." },
          },
          {
            user_id: zeroUuid,
            content: {
              content: "That's unfortunate. Let's cancel it..",
            },
          },
        ];

        await populateMemories(runtime, user, room_id, [conversation]);

        const message: Message = {
          userId: user.id as UUID,
          content: { content: "I've decided to mark Goal Y as failed." },
          room_id,
        };

        const state = await runtime.composeState(message);

        await evaluator.handler(runtime, message, state);

        const goals = await getGoals({
          runtime,
          room_id,
          onlyInProgress: false,
        });

        const goalY = goals.find((goal: Goal) => goal.name === "Goal Y");

        return goalY !== undefined && goalY.status === GoalStatus.FAILED;
      },
    );
  }, 60000);
});

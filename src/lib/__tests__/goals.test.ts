import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import {
  cancelGoal,
  createGoal,
  finishGoal,
  finishGoalObjective,
  getGoals,
  updateGoal,
} from "../goals";
import { BgentRuntime } from "../runtime";
import { GoalStatus, Objective, type Goal } from "../types";

dotenv.config({ path: ".dev.vars" });
describe("Goals", () => {
  let runtime: BgentRuntime;
  let user: User;

  beforeAll(async () => {
    const result = await createRuntime({
      env: process.env as Record<string, string>,
    });
    runtime = result.runtime;
    user = result.session.user;
    await runtime.supabase.from("goals").delete().match({ user_id: user.id });

    // delete all goals for the user
  });

  beforeEach(async () => {
    await runtime.supabase.from("goals").delete().match({ user_id: user.id });
  });

  afterAll(async () => {
    await runtime.supabase.from("goals").delete().match({ user_id: user.id });
  });

  // TODO: Write goal tests here
  test("createGoal - successfully creates a new goal", async () => {
    const newGoal: Goal = {
      name: "Test Create Goal",
      status: GoalStatus.IN_PROGRESS,
      user_ids: [user?.id as UUID],
      user_id: user?.id as UUID,
      objectives: [
        {
          description: "Test Objective",
          completed: false,
        },
      ],
    };

    await createGoal({
      runtime,
      goal: newGoal,
    });

    // Verify the goal is created in the database
    const goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });
    const createdGoal = goals.find((goal: Goal) => goal.name === newGoal.name);

    expect(createdGoal).toBeDefined();
    expect(createdGoal?.status).toEqual("IN_PROGRESS");
    expect(createdGoal?.objectives.length).toBeGreaterThan(0);
  });

  // Updating an existing goal
  test("updateGoals - successfully updates an existing goal", async () => {
    const newGoal: Goal = {
      name: "Test Create Goal",
      status: GoalStatus.IN_PROGRESS,
      user_ids: [user?.id as UUID],
      user_id: user?.id as UUID,
      objectives: [
        {
          description: "Test Objective",
          completed: false,
        },
      ],
    };

    await createGoal({
      runtime,
      goal: newGoal,
    });

    // retrieve the goal from the database
    let goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });
    const existingGoal = goals.find((goal: Goal) => goal.name === newGoal.name);
    console.log("*** existingGoal", existingGoal);
    const updatedGoal = { ...existingGoal, status: "COMPLETED" };
    const { error } = await updateGoal({
      runtime,
      userIds: [user?.id as UUID],
      goal: updatedGoal,
    });

    if (error) {
      console.log("*** error", error);
    }

    // Verify the goal's status is updated in the database
    goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });
    console.log("goals", goals);
    const updatedGoalInDb = goals.find(
      (goal: Goal) => goal.id === existingGoal.id,
    );

    expect(updatedGoalInDb?.status).toEqual("COMPLETED");
  });

  // Finishing a goal
  test("finishGoal - successfully marks a goal as finished", async () => {
    const newGoal: Goal = {
      name: "Test Create Goal",
      status: GoalStatus.IN_PROGRESS,
      user_ids: [user?.id as UUID],
      user_id: user?.id as UUID,
      objectives: [
        {
          description: "Test Objective",
          completed: false,
        },
      ],
    };

    let result = await createGoal({
      runtime,
      goal: newGoal,
    });

    // Verify the goal is created in the database
    let goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });

    const goalToFinish = goals.find((goal: Goal) => goal.name === newGoal.name);

    // now create the goal

    result = await finishGoal({
      runtime,
      goalId: goalToFinish.id as UUID,
    });

    console.log("result", result);

    // Verify the goal's status is updated to "DONE" in the database
    goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });

    const finishedGoal = goals.find(
      (goal: Goal) => goal.id === goalToFinish.id,
    );
    console.log("finishedGoal", finishedGoal);

    expect(finishedGoal?.status).toEqual(GoalStatus.DONE);
  });

  // Cancelling a goal
  test("cancelGoal - successfully marks a goal as failed", async () => {
    const newGoal: Goal = {
      name: "Test Create Goal",
      status: GoalStatus.IN_PROGRESS,
      user_ids: [user?.id as UUID],
      user_id: user?.id as UUID,
      objectives: [
        {
          description: "Test Objective",
          completed: false,
        },
      ],
    };

    let result = await createGoal({
      runtime,
      goal: newGoal,
    });

    // Verify the goal is created in the database
    let goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });

    const goalToFinish = goals.find((goal: Goal) => goal.name === newGoal.name);

    // now create the goal

    console.log("goalToFinish", goalToFinish);

    result = await cancelGoal({
      runtime,
      goalId: goalToFinish.id as UUID,
    });

    console.log("result", result);

    // Verify the goal's status is updated to "DONE" in the database
    goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });

    console.log("goals", goals);

    const finishedGoal = goals.find(
      (goal: Goal) => goal.id === goalToFinish.id,
    );
    console.log("finishedGoal", finishedGoal);

    expect(finishedGoal?.status).toEqual(GoalStatus.FAILED);
  });

  // Finishing an objective within a goal
  test("finishGoalObjective - successfully marks an objective as done", async () => {
    const newGoal: Goal = {
      name: "Test Create Goal",
      status: GoalStatus.IN_PROGRESS,
      user_ids: [user?.id as UUID],
      user_id: user?.id as UUID,
      objectives: [
        {
          description: "Test Objective",
          completed: false,
        },
      ],
    };

    const result = await createGoal({
      runtime,
      goal: newGoal,
    });

    console.log("result", result);

    // Verify the goal is created in the database
    const goals = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });

    const goalToFinish = goals.find((goal: Goal) => goal.name === newGoal.name);

    const objectiveToFinish = goalToFinish.objectives[0];

    await finishGoalObjective({
      runtime,
      goalId: goalToFinish.id as UUID,
      objectiveId: objectiveToFinish.id as string,
    });

    // Verify the objective's status is updated to "DONE" in the database
    const updatedGoal = await getGoals({
      runtime,
      userIds: [user?.id as UUID],
      onlyInProgress: false,
    });
    const updatedObjective = updatedGoal
      .find((goal: Goal) => goal.id === goalToFinish.id)
      ?.objectives.find((obj: Objective) => obj.id === objectiveToFinish.id);

    expect(updatedObjective?.completed).toBeTruthy();
  });
});

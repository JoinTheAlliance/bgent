import { type UUID } from "crypto";
import { BgentRuntime } from "./runtime";
import { type Goal, GoalStatus, type Objective } from "./types";

export const getGoals = async ({
  runtime,
  userIds,
  userId,
  onlyInProgress = true,
  count = 5,
}: {
  runtime: BgentRuntime;
  userIds: UUID[];
  userId?: UUID;
  onlyInProgress?: boolean;
  count?: number;
}) => {
  return runtime.databaseAdapter.getGoals({
    userIds,
    userId,
    onlyInProgress,
    count,
  });
};

export const formatGoalsAsString = async ({ goals }: { goals: Goal[] }) => {
  const goalStrings = goals.map((goal: Goal) => {
    const header = `Goal: ${goal.name}\nid: ${goal.id}`;
    const objectives =
      "Objectives:\n" +
      goal.objectives
        .map((objective: Objective) => {
          return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description} ${objective.completed ? " (DONE)" : " (IN PROGRESS)"}`;
        })
        .join("\n");
    return `${header}\n${objectives}`;
  });
  return goalStrings.join("\n");
};

export const updateGoal = async ({
  runtime,
  goal,
}: {
  runtime: BgentRuntime;
  goal: Goal;
}) => {
  return runtime.databaseAdapter.updateGoal(goal);
};

export const createGoal = async ({
  runtime,
  goal,
}: {
  runtime: BgentRuntime;
  goal: Goal;
}) => {
  return runtime.databaseAdapter.createGoal(goal);
};

export const cancelGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  return await runtime.databaseAdapter.updateGoalStatus({
    goalId,
    status: GoalStatus.FAILED,
  });
};

export const finishGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  const goal = await runtime.databaseAdapter.getGoals({
    userIds: [],
    userId: null,
    onlyInProgress: false,
    count: 1,
  });
  if (goal[0]?.id === goalId) {
    goal[0].status = GoalStatus.DONE;
    return runtime.databaseAdapter.updateGoal(goal[0]);
  }
};

export const finishGoalObjective = async ({
  runtime,
  goalId,
  objectiveId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
  objectiveId: string;
}) => {
  const goals = await runtime.databaseAdapter.getGoals({
    userIds: [],
    userId: null,
    onlyInProgress: false,
    count: 1,
  });
  const goal = goals.find((g) => g.id === goalId);
  if (goal) {
    const objective = goal.objectives.find((o) => o.id === objectiveId);
    if (objective) {
      objective.completed = true;
      return runtime.databaseAdapter.updateGoal(goal);
    }
  }
};

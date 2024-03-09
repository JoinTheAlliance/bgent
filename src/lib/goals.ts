import { type UUID } from "crypto";
import { BgentRuntime } from "./runtime";
import { type Goal, type Objective } from "./types";

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

import { type UUID } from "crypto";
import { BgentRuntime } from "./runtime";
import { type Goal, GoalStatus, type Objective } from "./types";

export const getGoals = async ({
  runtime,
  userIds,
  userId = null,
  onlyInProgress = true,
  count = 5,
}: {
  runtime: BgentRuntime;
  userIds: string[];
  userId?: string | null;
  onlyInProgress?: boolean;
  count?: number;
}) => {
  const opts = {
    query_user_ids: userIds,
    query_user_id: userId,
    only_in_progress: onlyInProgress,
    row_count: count,
  };
  const { data: goals, error } = await runtime.supabase.rpc(
    "get_goals_by_user_ids",
    opts,
  );

  if (error) {
    throw new Error(error.message);
  }

  return goals;
};

export const formatGoalsAsString = async ({ goals }: { goals: Goal[] }) => {
  const goalStrings = goals.map((goal: Goal) => {
    const header = `Name: ${goal.name}\nid: ${goal.id}`;
    const objectives =
      "Objectives:\n" +
      goal.objectives
        .map((objective: Objective) => {
          return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description}`;
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
  return await runtime.supabase
    .from("goals")
    .update(goal)
    .match({ id: goal.id });
};

export const createGoal = async ({
  runtime,
  goal,
}: {
  runtime: BgentRuntime;
  goal: Goal;
}) => {
  return await runtime.supabase.from("goals").upsert(goal);
};

export const cancelGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  return await runtime.supabase
    .from("goals")
    .update({ status: GoalStatus.FAILED })
    .match({ id: goalId });
};

export const finishGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  return await runtime.supabase
    .from("goals")
    .update({ status: GoalStatus.DONE })
    .match({ id: goalId });
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
  const { data: goal, error } = await runtime.supabase
    .from("goals")
    .select("*")
    .match({ id: goalId })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updatedObjectives = goal.objectives.map((objective: Objective) => {
    if (objective.id === objectiveId) {
      return { ...objective, completed: true };
    }
    return objective;
  });

  return await runtime.supabase
    .from("goals")
    .update({ objectives: updatedObjectives })
    .match({ id: goalId });
};

import { type UUID } from "crypto";
import { BgentRuntime } from "./runtime";
import { type Goal, type Objective } from "./types";

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
  const { data: goals, error } = await runtime.supabase.rpc(
    "get_goals_by_user_ids",
    {
      query_user_ids: userIds,
      query_user_id: userId,
      only_in_progress: onlyInProgress,
      row_count: count,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return goals;
};

export const formatGoalsAsString = async ({ goals }: { goals: Goal[] }) => {
  const goalStrings = goals.map((goal: Goal) => {
    const header = `${goal.name} - ${goal.status}`;
    const objectives = goal.objectives.map((objective: Objective) => {
      return `- ${objective.completed ? "[x]" : "[ ]"} ${objective.description}`;
    });
    return `${header}\n${objectives.join("\n")}`;
  });
  return goalStrings.join("\n");
};

export const updateGoals = async ({
  runtime,
  userIds,
  goals,
}: {
  runtime: BgentRuntime;
  userIds: UUID[];
  goals: Goal[];
}) => {
  for (const goal of goals) {
    await runtime.supabase
      .from("goals")
      .update(goal)
      .match({ id: goal.id })
      .in("user_ids", userIds);
  }
};

export const createGoal = async ({
  runtime,
  goal,
  userIds,
  userId,
}: {
  runtime: BgentRuntime;
  goal: Goal;
  userIds: string[];
  userId: string;
}) => {
  const { error } = await runtime.supabase
    .from("goals")
    .upsert({ ...goal, user_ids: userIds, user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
};

export const cancelGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  await runtime.supabase
    .from("goals")
    .update({ status: "FAILED" })
    .match({ id: goalId });
};

export const finishGoal = async ({
  runtime,
  goalId,
}: {
  runtime: BgentRuntime;
  goalId: UUID;
}) => {
  await runtime.supabase
    .from("goals")
    .update({ status: "DONE" })
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
      return { ...objective, status: "DONE" };
    }
    return objective;
  });

  await runtime.supabase
    .from("goals")
    .update({ objectives: updatedObjectives })
    .match({ id: goalId });
};

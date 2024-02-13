import { type SupabaseClient } from "@supabase/supabase-js";
import { type Goal, type Objective } from "./types";
import { type UUID } from "crypto";

export const getGoals = async ({
  supabase,
  userIds,
  userId = null,
  onlyInProgress = true,
  count = 5,
}: {
  supabase: SupabaseClient;
  userIds: string[];
  userId?: string | null;
  onlyInProgress?: boolean;
  count?: number;
}) => {
  const { data: goals, error } = await supabase.rpc("get_goals_by_user_ids", {
    query_user_ids: userIds,
    query_user_id: userId,
    only_in_progress: onlyInProgress,
    row_count: count,
  });

  if (error) {
    throw new Error(error.message);
  }

  return goals;
};

export const formatGoalsAsString = async ({ goals }: { goals: Goal[] }) => {
  // format goals as a string
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
  supabase,
  userIds,
  goals,
}: {
  supabase: SupabaseClient;
  userIds: UUID[];
  goals: Goal[];
}) => {
  for (const goal of goals) {
    await supabase
      .from("goals")
      .update(goal)
      .match({ id: goal.id })
      .in("user_ids", userIds);
  }
};

export const createGoal = async ({
  supabase,
  goal,
  userIds,
  userId,
}: {
  supabase: SupabaseClient;
  goal: Goal;
  userIds: string[];
  userId: string;
}) => {
  const { error } = await supabase
    .from("goals")
    .upsert({ ...goal, user_ids: userIds, user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
};

export const cancelGoal = async ({
  supabase,
  goalId,
}: {
  supabase: SupabaseClient;
  goalId: UUID;
}) => {
  await supabase
    .from("goals")
    .update({ status: "FAILED" })
    .match({ id: goalId });
};

export const finishGoal = async ({
  supabase,
  goalId,
}: {
  supabase: SupabaseClient;
  goalId: UUID;
}) => {
  await supabase.from("goals").update({ status: "DONE" }).match({ id: goalId });
};

export const finishGoalObjective = async ({
  supabase,
  goalId,
  objectiveId,
}: {
  supabase: SupabaseClient;
  goalId: UUID;
  objectiveId: string;
}) => {
  const { data: goal, error } = await supabase
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

  await supabase
    .from("goals")
    .update({ objectives: updatedObjectives })
    .match({ id: goalId });
};

// Export from ./src/lib/actions
export {
  composeActionExamples,
  defaultActions,
  formatActionConditions,
  formatActionNames,
  formatActions,
  getFormattedActions,
} from "./lib/actions";

// Export from ./src/lib/constants
export { zeroUuid, zeroUuidPlus1 } from "./lib/constants";

// Export from ./src/lib/context
export { addHeader, composeContext } from "./lib/context";

export { DatabaseAdapter } from "./lib/database";
export { SupabaseDatabaseAdapter } from "./lib/adapters/supabase";

import wait from "./lib/actions/wait";
export { wait };

import elaborate from "./lib/actions/elaborate";
export { elaborate };

import ignore from "./lib/actions/ignore";
export { ignore };

// Export from ./src/lib/evaluators
export {
  defaultEvaluators,
  evaluationTemplate,
  formatEvaluatorConditions,
  formatEvaluatorExampleConditions,
  formatEvaluatorExampleDescriptions,
  formatEvaluatorExamples,
  formatEvaluatorNames,
  formatEvaluators,
} from "./lib/evaluators";

// Export from ./src/lib/goals
export {
  cancelGoal,
  createGoal,
  finishGoal,
  finishGoalObjective,
  formatGoalsAsString,
  getGoals,
  updateGoal,
} from "./lib/goals";

// Export from ./src/lib/lore
export { addLore, formatLore, getLore } from "./lib/lore";

// Export from ./src/lib/memory
export {
  MemoryManager,
  embeddingDimension,
  embeddingZeroVector,
} from "./lib/memory";

// Export from ./src/lib/messages
export { formatActors, formatMessages, getActorDetails } from "./lib/messages";

// Export from ./src/lib/providers
export { defaultProviders, getProviders } from "./lib/providers";

// Export from ./src/lib/relationships
export {
  createRelationship,
  formatRelationships,
  getRelationship,
  getRelationships,
} from "./lib/relationships";

// Export from ./src/lib/runtime
export { BgentRuntime } from "./lib/runtime";

// Export from ./src/lib/templates
export { messageHandlerTemplate } from "./lib/templates";

// Export from ./src/lib/types
export { GoalStatus } from "./lib/types";
export type {
  Action,
  ActionExample,
  Actor,
  Content,
  ConversationExample,
  EvaluationExample,
  Evaluator,
  Goal,
  Handler,
  Memory,
  Message,
  MessageExample,
  Objective,
  Provider,
  Relationship,
  State,
  Validator,
} from "./lib/types";

// Export from ./src/lib/utils
export { parseJSONObjectFromText, parseJsonArrayFromText } from "./lib/utils";

// Export from ./src/test/createRuntime
export { createRuntime } from "./test/createRuntime";

// Export from ./src/test/populateMemories
export { populateMemories } from "./test/populateMemories";

// Export from ./src/test/runAiTest
export { runAiTest } from "./test/runAiTest";

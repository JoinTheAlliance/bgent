// Export from ./src/lib/actions
export {
  defaultActions,
  composeActionExamples,
  getFormattedActions,
  formatActionNames,
  formatActions,
  formatActionConditions,
} from "./lib/actions";

// Export from ./src/lib/constants
export { zeroUuid, zeroUuidPlus1 } from "./lib/constants";

// Export from ./src/lib/context
export { composeContext, addHeader } from "./lib/context";

// Export from ./src/lib/evaluators
export {
  defaultEvaluators,
  evaluationTemplate,
  formatEvaluatorNames,
  formatEvaluators,
  formatEvaluatorConditions,
  formatEvaluatorExamples,
  formatEvaluatorExampleConditions,
  formatEvaluatorExampleDescriptions,
} from "./lib/evaluators";

// Export from ./src/lib/goals
export {
  getGoals,
  formatGoalsAsString,
  updateGoal,
  createGoal,
  cancelGoal,
  finishGoal,
  finishGoalObjective,
} from "./lib/goals";

// Export from ./src/lib/lore
export { addLore, getLore, formatLore } from "./lib/lore";

// Export from ./src/lib/memory
export {
  MemoryManager,
  embeddingDimension,
  embeddingZeroVector,
} from "./lib/memory";

// Export from ./src/lib/messages
export { getActorDetails, formatActors, formatMessages } from "./lib/messages";

// Export from ./src/lib/providers
export { defaultProviders, getProviders } from "./lib/providers";

// Export from ./src/lib/relationships
export {
  createRelationship,
  getRelationship,
  getRelationships,
  formatRelationships,
} from "./lib/relationships";

// Export from ./src/lib/runtime
export { BgentRuntime } from "./lib/runtime";

// Export from ./src/lib/templates
export { messageHandlerTemplate } from "./lib/templates";

// Export from ./src/lib/types
export { GoalStatus } from "./lib/types";
export type {
  Content,
  ActionExample,
  ConversationExample,
  Actor,
  Memory,
  Objective,
  Goal,
  State,
  Message,
  MessageExample,
  Handler,
  Validator,
  Action,
  EvaluationExample,
  Evaluator,
  Provider,
  Relationship,
} from "./lib/types";

// Export from ./src/lib/utils
export { parseJsonArrayFromText, parseJSONObjectFromText } from "./lib/utils";

// Export from ./src/lib/actions/continue
export { default as continueAction } from "./lib/actions/continue";

// Export from ./src/lib/actions/ignore
export { default as ignoreAction } from "./lib/actions/ignore";

// Export from ./src/lib/actions/wait
export { default as waitAction } from "./lib/actions/wait";

// Export from ./src/lib/evaluators/fact
export { formatFacts, default as factEvaluator } from "./lib/evaluators/fact";

// Export from ./src/lib/evaluators/goal
export { default as goalEvaluator } from "./lib/evaluators/goal";

// Export from ./src/lib/providers/time
export { default as timeProvider } from "./lib/providers/time";

// Export from ./src/lib/logger
export { default as logger } from "./lib/logger";

// Export from ./src/test/cache
import { getCachedEmbedding, writeCachedEmbedding } from "./test/cache";

// Export from ./src/test/constants
import {
  SERVER_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_EMAIL_2,
  TEST_PASSWORD_2,
} from "./test/constants";

// Export from ./src/test/createRuntime
import { createRuntime } from "./test/createRuntime";

// Export from ./src/test/data
import {
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
  GetTellMeAboutYourselfConversationTroll1,
  GetTellMeAboutYourselfConversationTroll2,
  Goodbye1,
  jimFacts,
} from "./test/data";

// Export from ./src/test/populateMemories
import { populateMemories } from "./test/populateMemories";

// Export from ./src/test/report
import { deleteReport, addToReport, logReport } from "./test/report";

// Export from ./src/test/runAiTest
import { runAiTest } from "./test/runAiTest";

// Export from ./src/test/testAction
import { TEST_ACTION, TEST_ACTION_FAIL } from "./test/testAction";

// Export from ./src/test/testEvaluator
import { TEST_EVALUATOR, TEST_EVALUATOR_FAIL } from "./test/testEvaluator";

export const test = {
  getCachedEmbedding,
  writeCachedEmbedding,
  SERVER_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_EMAIL_2,
  TEST_PASSWORD_2,
  createRuntime,
  GetTellMeAboutYourselfConversation1,
  GetTellMeAboutYourselfConversation2,
  GetTellMeAboutYourselfConversation3,
  GetTellMeAboutYourselfConversationTroll1,
  GetTellMeAboutYourselfConversationTroll2,
  Goodbye1,
  jimFacts,
  populateMemories,
  deleteReport,
  addToReport,
  logReport,
  runAiTest,
  TEST_ACTION,
  TEST_ACTION_FAIL,
  TEST_EVALUATOR,
  TEST_EVALUATOR_FAIL,
};

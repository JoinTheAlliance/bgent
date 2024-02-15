import summarization from "./evaluators/summarization";
import { type Evaluator } from "./types";

export const defaultEvaluators: Evaluator[] = [
  summarization,
  // goal,
];

export const evaluationTemplate = `TASK: Based on the conversation and conditions, determine which evaluation functions are appropriate to call.
Examples:
{{evaluatorExamples}}

INSTRUCTIONS: You are helping me to decide which appropriate functions to call based on the conversation between {{senderName}} and {{agentName}}.

Recent conversation:
{{recentMessages}}

Evaluator Functions:
{{evaluators}}

Evaluator Conditions:
{{evaluatorConditions}}

TASK: Based on the most recent conversation, determine which evaluators functions are appropriate to call to call.
Include the name of evaluators that are relevant and should be called in the array
Available evaluator names to include are {{evaluatorNames}}
Respond with a JSON array containing a field for description in a JSON block formatted for markdown with this structure:
\`\`\`json
[
  'evaluatorName',
  'evaluatorName'
]
\`\`\`

Your response must include the JSON block.`;

// evaluation

export function formatEvaluatorNames(evaluators: Evaluator[]) {
  return evaluators
    .map((evaluator: Evaluator) => `'${evaluator.name}'`)
    .join(",\n");
}

export function formatEvaluators(evaluators: Evaluator[]) {
  return evaluators
    .map(
      (evaluator: Evaluator) => `'${evaluator.name}: ${evaluator.description}'`,
    )
    .join(",\n");
}

export function formatEvaluatorConditions(evaluators: Evaluator[]) {
  return evaluators
    .map(
      (evaluator: Evaluator) => `'${evaluator.name}: ${evaluator.condition}'`,
    )
    .join(",\n");
}

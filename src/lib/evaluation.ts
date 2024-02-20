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

import { uniqueNamesGenerator, names } from "unique-names-generator";

// Formats evaluator examples into a readable string
export function formatEvaluatorExamples(evaluators: Evaluator[]) {
  return evaluators
    .map((evaluator) => {
      return evaluator.examples
        .map((example) => {
          const exampleNames = Array.from({ length: 5 }, () =>
            uniqueNamesGenerator({ dictionaries: [names] }),
          );

          let formattedContext = example.context;
          let formattedOutcome = example.outcome;

          exampleNames.forEach((name, index) => {
            const placeholder = `{{user${index + 1}}}`;
            formattedContext = formattedContext.replaceAll(placeholder, name);
            formattedOutcome = formattedOutcome.replaceAll(placeholder, name);
          });

          const formattedMessages = example.messages
            .map((message) => {
              let messageString = `${message.user}: ${message.content}`;
              exampleNames.forEach((name, index) => {
                const placeholder = `{{user${index + 1}}}`;
                messageString = messageString.replaceAll(placeholder, name);
              });
              return (
                messageString + (message.action ? ` (${message.action})` : "")
              );
            })
            .join("\n");

          return `Context:\n${formattedContext}\n\nMessages:\n${formattedMessages}\n\nOutcome:\n${formattedOutcome}`;
        })
        .join("\n\n");
    })
    .join("\n\n");
}

// Generates a string describing the conditions under which each evaluator example is relevant
export function formatEvaluatorExampleConditions(evaluators: Evaluator[]) {
  return evaluators
    .map((evaluator) =>
      evaluator.examples
        .map(
          (_example, index) =>
            `${evaluator.name} Example ${index + 1}: ${evaluator.condition}`,
        )
        .join("\n"),
    )
    .join("\n\n");
}

// Generates a string summarizing the descriptions of each evaluator example
export function formatEvaluatorExampleDescriptions(evaluators: Evaluator[]) {
  return evaluators
    .map((evaluator) =>
      evaluator.examples
        .map(
          (_example, index) =>
            `${evaluator.name} Example ${index + 1}: ${evaluator.description}`,
        )
        .join("\n"),
    )
    .join("\n\n");
}

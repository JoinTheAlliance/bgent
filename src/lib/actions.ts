import { names, uniqueNamesGenerator } from "unique-names-generator";
import { Action, ContentExample } from "./types";

import cont from "./actions/continue";
import ignore from "./actions/ignore";
import wait from "./actions/wait";

export const defaultActions: Action[] = [cont, wait, ignore];

export const composeActionExamples = (actionsData: Action[], count: number) => {
  const actionExamples: ContentExample[][] = actionsData
    .map((action: Action) => action.examples)
    .flat();

  const randomMessageExamples: ContentExample[][] = [];

  // make sure count is not more than actionExamples
  const maxCount = actionExamples.length;
  if (count > maxCount) {
    count = maxCount;
  }

  while (
    randomMessageExamples.length < count &&
    randomMessageExamples.length < actionExamples.length
  ) {
    const randomIndex = Math.floor(Math.random() * actionExamples.length);
    const randomExample = actionExamples[randomIndex];
    if (!randomMessageExamples.includes(randomExample)) {
      randomMessageExamples.push(randomExample);
    }
  }

  console.log("*** message example count: ", randomMessageExamples.length);

  const exampleNames = Array.from({ length: 5 }, () =>
    uniqueNamesGenerator({ dictionaries: [names] }),
  );

  const formattedExamples = randomMessageExamples.map((example) => {
    return `\n${example
      .map((message) => {
        return JSON.stringify(message);
      })
      .join("\n")}`;
  });

  const exampleString = formattedExamples.join("\n\n");

  for (let i = 0; i < exampleNames.length; i++) {
    exampleString.replace(`{{user${i + 1}}}`, exampleNames[i]);
  }

  return exampleString;
};

export function getFormattedActions(actions: Action[]) {
  return actions
    .map((action) => {
      return `${action.name} - ${action.description}`;
    })
    .join("\n");
}

export function formatActionNames(actions: Action[]) {
  return actions.map((action: Action) => `'${action.name}'`).join(",\n");
}

export function formatActions(actions: Action[]) {
  return actions
    .map((action: Action) => `'${action.name}: ${action.description}'`)
    .join(",\n");
}

export function formatActionConditions(actions: Action[]) {
  return actions
    .map((action: Action) => `'${action.name}: ${action.condition}'`)
    .join(",\n");
}

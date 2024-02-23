import { type State } from "./types";

/**
 * Composes a context string by replacing placeholders in a template with corresponding values from the state.
 *
 * This function takes a template string with placeholders in the format `{{placeholder}}` and a state object.
 * It replaces each placeholder with the value from the state object that matches the placeholder's name.
 * If a matching key is not found in the state object for a given placeholder, the placeholder is replaced with an empty string.
 *
 * @param {Object} params - The parameters for composing the context.
 * @param {State} params.state - The state object containing values to replace the placeholders in the template.
 * @param {string} params.template - The template string containing placeholders to be replaced with state values.
 * @returns {string} The composed context string with placeholders replaced by corresponding state values.
 *
 * @example
 * // Given a state object and a template
 * const state = { userName: "Alice", userAge: 30 };
 * const template = "Hello, {{userName}}! You are {{userAge}} years old.";
 *
 * // Composing the context will result in:
 * // "Hello, Alice! You are 30 years old."
 * const context = composeContext({ state, template });
 */
export const composeContext = ({
  state,
  template,
}: {
  state: State;
  template: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error match isn't working as expected
  const out = template.replace(/{{\w+}}/g, (match) => {
    const key = match.replace(/{{|}}/g, "");
    return state[key] ?? "";
  });
  return out;
};

import { type State } from "./types";

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

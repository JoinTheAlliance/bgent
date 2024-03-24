import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import { composeContext } from "../../context";
import { BgentRuntime } from "../../runtime";
import { type Message, type State, type UUID } from "../../types";
import timeProvider from "../time";
import { zeroUuid } from "../../constants";

dotenv.config({ path: ".dev.vars" });

describe("Time Provider", () => {
  let runtime: BgentRuntime;
  let user: { id: UUID };
  let room_id: UUID;

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      providers: [timeProvider],
    });
    runtime = setup.runtime;
    user = { id: setup.session.user?.id as UUID };
    room_id = zeroUuid;
  });

  test("Time provider should return the current time in the correct format", async () => {
    const message: Message = {
      user_id: user.id,
      content: { content: "" },
      room_id: room_id,
    };

    const currentTimeResponse = await timeProvider.get(
      runtime,
      message,
      {} as State,
    );
    expect(currentTimeResponse).toMatch(
      /^The current time is: \d{1,2}:\d{2}:\d{2}\s?(AM|PM)$/,
    );
  });

  test("Time provider should be integrated in the state and context correctly", async () => {
    const message: Message = {
      user_id: user.id,
      content: { content: "" },
      room_id: room_id,
    };

    // Manually integrate the time provider's response into the state
    const state = await runtime.composeState(message);

    const contextTemplate = `Current Time: {{providers}}`;
    const context = composeContext({
      state: state,
      template: contextTemplate,
    });

    const match = context.match(
      new RegExp(
        `^Current Time: The current time is: \\d{1,2}:\\d{2}:\\d{2}\\s?(AM|PM)$`,
      ),
    );

    expect(match).toBeTruthy();
  });

  test("Time provider should work independently", async () => {
    const message: Message = {
      user_id: user.id,
      content: { content: "" },
      room_id: room_id,
    };
    const currentTimeResponse = await timeProvider.get(runtime, message);

    expect(currentTimeResponse).toMatch(
      /^The current time is: \d{1,2}:\d{2}:\d{2}\s?(AM|PM)$/,
    );
  });
});

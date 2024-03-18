import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../test/createRuntime";
import { BgentRuntime } from "../runtime";
import { type Message, type Provider, type State } from "../types";
import { zeroUuid } from "../constants";

dotenv.config({ path: ".dev.vars" });

const TestProvider: Provider = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get: async (_runtime: BgentRuntime, _message: Message, _state?: State) => {
    return "Hello Test";
  },
};

describe("TestProvider", () => {
  let runtime: BgentRuntime;
  let room_id: UUID;

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      providers: [TestProvider],
    });
    runtime = setup.runtime;
    room_id = zeroUuid;
  });

  test("TestProvider should return 'Hello Test'", async () => {
    const message: Message = {
      userId: zeroUuid,
      content: { content: "" },
      room_id: room_id,
    };

    const testProviderResponse = await TestProvider.get(
      runtime,
      message,
      {} as State,
    );
    expect(testProviderResponse).toBe("Hello Test");
  });

  test("TestProvider should be integrated in the runtime providers", async () => {
    expect(runtime.providers).toContain(TestProvider);
  });
});

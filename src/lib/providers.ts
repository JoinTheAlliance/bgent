import time from "./providers/time";
import { BgentRuntime } from "./runtime";
import { type Message, type Provider } from "./types";

export const defaultProviders: Provider[] = [time];

/**
 * Formats provider outputs into a string which can be injected into the context.
 * @param runtime The Bgent runtime object.
 * @param message The incoming message object.
 * @returns A string that concatenates the outputs of each provider.
 */
export async function getProviders(runtime: BgentRuntime, message: Message) {
  const providerResults = await Promise.all(
    runtime.providers.map(async (provider) => {
      return await provider.get(runtime, message);
    }),
  );

  return providerResults.join("\n");
}

import { Session, User, createClient } from "@supabase/supabase-js";
import { BgentRuntime } from "../lib/runtime";
import { Action, Evaluator, Provider } from "../lib/types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "./constants";

export async function createRuntime({
  env,
  recentMessageCount,
  evaluators = [],
  actions = [],
  providers = [],
}: {
  env?: Record<string, string> | NodeJS.ProcessEnv;
  recentMessageCount?: number;
  evaluators?: Evaluator[];
  actions?: Action[];
  providers?: Provider[];
}) {
  const supabase = createClient(
    env?.SUPABASE_URL ?? SUPABASE_URL,
    env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
  );

  const { data } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL!,
    password: TEST_PASSWORD!,
  });

  let { user, session } = data;

  if (!session) {
    const response = await supabase.auth.signUp({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });
    user = response.data.user as User;
    session = response.data.session as Session;
  }

  const runtime = new BgentRuntime({
    debugMode: false,
    serverUrl: "https://api.openai.com/v1",
    supabase,
    recentMessageCount,
    token: env!.OPENAI_API_KEY!,
    actions: actions ?? [],
    evaluators: evaluators ?? [],
    providers: providers ?? [],
  });

  return { user, session, runtime };
}

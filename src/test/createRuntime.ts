import { Session, User, createClient } from "@supabase/supabase-js";
import { BgentRuntime } from "../lib/runtime";
import {
  TEST_EMAIL,
  TEST_PASSWORD,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "./constants";
import { Action, Evaluator } from "../lib/types";

export async function createRuntime({
  env,
  recentMessageCount,
  evaluators = [],
  actions = [],
}: {
  env?: Record<string, string> | NodeJS.ProcessEnv;
  recentMessageCount?: number;
  evaluators?: Evaluator[];
  actions?: Action[];
}) {
  const supabase = createClient(
    env?.SUPABASE_URL ?? SUPABASE_URL,
    env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
  );

  let {
    data: { user, session },
  } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL!,
    password: TEST_PASSWORD!,
  });

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
  });

  return { user, session, runtime };
}

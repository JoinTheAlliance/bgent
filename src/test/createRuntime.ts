import { Session, User, createClient } from "@supabase/supabase-js";
import { BgentRuntime } from "../lib/runtime";
import { Action, Evaluator, Provider } from "../lib/types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "./constants";
import { DatabaseAdapter } from "../lib/database";
import { SupabaseDatabaseAdapter } from "../lib/adapters/supabase";

export async function createRuntime({
  env,
  recentMessageCount,
  evaluators = [],
  actions = [],
  providers = [],
  databaseAdapter,
}: {
  env?: Record<string, string> | NodeJS.ProcessEnv;
  recentMessageCount?: number;
  evaluators?: Evaluator[];
  actions?: Action[];
  providers?: Provider[];
  databaseAdapter?: DatabaseAdapter;
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
    // change the name of the user
    const { error } = await supabase
      .from("accounts")
      .update({ name: "Test User" })
      .eq("id", data?.user?.id);

    if (error) {
      throw error;
    }
    user = response.data.user as User;
    session = response.data.session as Session;
  }

  const runtime = new BgentRuntime({
    debugMode: false,
    serverUrl: "https://api.openai.com/v1",
    recentMessageCount,
    token: env!.OPENAI_API_KEY!,
    actions: actions ?? [],
    evaluators: evaluators ?? [],
    providers: providers ?? [],
    databaseAdapter:
      databaseAdapter ??
      new SupabaseDatabaseAdapter(
        env?.SUPABASE_URL ?? SUPABASE_URL,
        env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
      ),
  });

  return { user, session, runtime };
}

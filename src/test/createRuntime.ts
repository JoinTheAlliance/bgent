import { createClient } from "@supabase/supabase-js";
import { BgentRuntime } from "../lib/runtime";
import {
  TEST_EMAIL,
  TEST_PASSWORD,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "./constants";
import { Evaluator } from "../lib/types";

export async function createRuntime({
  env = process.env,
  recentMessageCount,
  evaluators = [],
}: {
  env?: Record<string, string> | NodeJS.ProcessEnv;
  recentMessageCount?: number;
  evaluators?: Evaluator[];
}) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  const {
    data: { user, session },
  } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL!,
    password: TEST_PASSWORD!,
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const runtime = new BgentRuntime({
    debugMode: false,
    serverUrl: "https://api.openai.com/v1",
    supabase,
    recentMessageCount,
    token: env.OPENAI_API_KEY!,
    evaluators: evaluators ?? [],
  });

  return { user, session, runtime };
}

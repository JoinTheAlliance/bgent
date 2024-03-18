import { Session, createClient } from "@supabase/supabase-js";
import { User } from "./types";
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
import { SqliteDatabaseAdapter } from "../lib/adapters/sqlite";
import Database from "better-sqlite3";
import { UUID } from "crypto";

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
  let adapter: DatabaseAdapter;
  let user: User;
  let session: Session;

  switch (env?.TEST_DATABASE_CLIENT as string) {
    case "sqlite":
      {
        // SQLite adapter
        adapter = new SqliteDatabaseAdapter(new Database(":memory:"));

        // Create a test user and session
        user = {
          id: "test-user-id" as UUID,
          email: "test@example.com",
        } as User;
        session = {
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          user: user,
        } as Session;
      }
      break;
    case "supabase":
    default:
      {
        const supabase = createClient(
          env?.SUPABASE_URL ?? SUPABASE_URL,
          env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
        );

        const { data } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL!,
          password: TEST_PASSWORD!,
        });

        user = data.user as User;
        session = data.session as Session;

        if (!session) {
          const response = await supabase.auth.signUp({
            email: TEST_EMAIL!,
            password: TEST_PASSWORD!,
          });

          // Change the name of the user
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

        adapter = new SupabaseDatabaseAdapter(
          env?.SUPABASE_URL ?? SUPABASE_URL,
          env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
        );
      }
      break;
    }

  const runtime = new BgentRuntime({
    debugMode: false,
    serverUrl: "https://api.openai.com/v1",
    recentMessageCount,
    token: env!.OPENAI_API_KEY!,
    actions: actions ?? [],
    evaluators: evaluators ?? [],
    providers: providers ?? [],
    databaseAdapter: adapter,
  });

  return { user, session, runtime };
}

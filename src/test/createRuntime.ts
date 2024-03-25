import { SqliteDatabaseAdapter } from "../lib/adapters/sqlite";
import { SupabaseDatabaseAdapter } from "../lib/adapters/supabase";
import { zeroUuid } from "../lib/constants";
import { DatabaseAdapter } from "../lib/database";
import { BgentRuntime } from "../lib/runtime";
import { Action, Evaluator, Provider } from "../lib/types";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
} from "./constants";
import { User } from "./types";
import { load } from "../lib/adapters/sqlite/sqlite_vss";
import { SqlJsDatabaseAdapter } from "../lib/adapters/sqljs";

export async function createRuntime({
  env,
  conversationLength,
  evaluators = [],
  actions = [],
  providers = [],
}: {
  env?: Record<string, string> | NodeJS.ProcessEnv;
  conversationLength?: number;
  evaluators?: Evaluator[];
  actions?: Action[];
  providers?: Provider[];
}) {
  let adapter: DatabaseAdapter;
  let user: User;
  let session: {
    user: User;
  };

  switch (env?.TEST_DATABASE_CLIENT as string) {
    case "sqlite":
      {
        const module = await import("better-sqlite3");

        const Database = module.default;

        // SQLite adapter
        adapter = new SqliteDatabaseAdapter(new Database(":memory:"));

        // Load sqlite-vss
        await load((adapter as SqliteDatabaseAdapter).db);
        // Create a test user and session
        user = {
          id: zeroUuid,
          email: "test@example.com",
        } as User;
        session = {
          user: user,
        };
      }
      break;
    case "sqljs":
      {
        const module = await import("sql.js");

        const initSqlJs = module.default;

        // SQLite adapter
        const SQL = await initSqlJs({});
        const db = new SQL.Database();

        adapter = new SqlJsDatabaseAdapter(db);

        // Load sqlite-vss
        // load((adapter as SqliteDatabaseAdapter).db);
        // Create a test user and session
        user = {
          id: zeroUuid,
          email: "test@example.com",
        } as User;
        session = {
          user: user,
        };
      }
      break;
    case "supabase":
    default:
      {
        const module = await import("@supabase/supabase-js");

        const { createClient } = module;

        const supabase = createClient(
          env?.SUPABASE_URL ?? SUPABASE_URL,
          env?.SUPABASE_SERVICE_API_KEY ?? SUPABASE_ANON_KEY,
        );

        const { data } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL!,
          password: TEST_PASSWORD!,
        });

        user = data.user as User;
        session = data.session as unknown as { user: User };

        if (!session) {
          const response = await supabase.auth.signUp({
            email: TEST_EMAIL!,
            password: TEST_PASSWORD!,
          });

          // Change the name of the user
          const { error } = await supabase
            .from("accounts")
            .update({ name: "Test User" })
            .eq("id", response.data.user?.id);

          if (error) {
            throw new Error("Create runtime error: " + JSON.stringify(error));
          }

          user = response.data.user as User;
          session = response.data.session as unknown as { user: User };
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
    conversationLength,
    token: env!.OPENAI_API_KEY!,
    actions: actions ?? [],
    evaluators: evaluators ?? [],
    providers: providers ?? [],
    databaseAdapter: adapter,
  });

  return { user, session, runtime };
}

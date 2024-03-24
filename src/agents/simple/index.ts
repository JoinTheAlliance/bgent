// SERVER
import jwt from "@tsndr/cloudflare-worker-jwt";
import { composeContext } from "../../lib/context";
import { embeddingZeroVector } from "../../lib/memory";

import { SupabaseClient } from "@supabase/supabase-js";
import { defaultActions, defaultEvaluators } from "../../lib";
import { SupabaseDatabaseAdapter } from "../../lib/adapters/supabase";
import { zeroUuid } from "../../lib/constants";
import logger from "../../lib/logger";
import { BgentRuntime } from "../../lib/runtime";
import { messageHandlerTemplate } from "../../lib/templates";
import {
  type Content,
  type Message,
  type State,
  type UUID,
} from "../../lib/types";
import { parseJSONObjectFromText } from "../../lib/utils";

/**
 * Handle an incoming message, processing it and returning a response.
 * @param message The message to handle.
 * @param state The state of the agent.
 * @returns The response to the message.
 */
async function handleMessage(
  runtime: BgentRuntime,
  message: Message,
  state?: State,
) {
  const room_id = message.room_id ?? "00000000-0000-0000-0000-000000000000";

  // Create the room if it doesn't exist
  await runtime.databaseAdapter.createRoom(message.room_id);

  const _saveRequestMessage = async (message: Message, state: State) => {
    const { content, user_id, room_id } = message;
    if (content) {
      await runtime.messageManager.createMemory({
        user_id: user_id!,
        content,
        room_id,
        embedding: embeddingZeroVector,
      });
      await runtime.evaluate(message, state);
    }
  };

  await _saveRequestMessage(message, state as State);
  if (!state) {
    state = (await runtime.composeState(message)) as State;
  }

  const context = composeContext({
    state,
    template: messageHandlerTemplate,
  });

  if (runtime.debugMode) {
    logger.log(context, "Response Context", "cyan");
  }

  let responseContent: Content | null = null;
  const { user_id } = message;

  for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
    const response = await runtime.completion({
      context,
      stop: [],
    });

    runtime.databaseAdapter.log({
      body: { message, context, response },
      user_id: user_id,
      room_id,
      type: "simple_agent_main_completion",
    });

    const parsedResponse = parseJSONObjectFromText(
      response,
    ) as unknown as Content;

    if (parsedResponse && parsedResponse.content && parsedResponse.action) {
      responseContent = {
        content: parsedResponse.content,
        action: parsedResponse.action,
      };
      break;
    }
  }

  if (!responseContent) {
    responseContent = {
      content: "",
      action: "IGNORE",
    };
  }

  const _saveResponseMessage = async (
    message: Message,
    state: State,
    responseContent: Content,
  ) => {
    const { room_id } = message;

    responseContent.content = responseContent.content?.trim();

    if (responseContent.content) {
      await runtime.messageManager.createMemory({
        user_id: runtime.agentId,
        content: responseContent,
        room_id,
        embedding: embeddingZeroVector,
      });
      await runtime.evaluate(message, { ...state, responseContent });
    } else {
      console.warn("Empty response, skipping");
    }
  };

  await _saveResponseMessage(message, state, responseContent);
  await runtime.processActions(message, responseContent);

  return responseContent;
}

async function ensureUserExists(
  supabase: SupabaseClient,
  user_id: string,
  email: string,
  name: string,
) {
  const { data: user, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", user_id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking user existence:", error);
    throw error;
  }

  if (!user) {
    await supabase.from("accounts").insert({
      id: user_id,
      name,
      email,
    });
  }
}

async function ensureParticipantExists(
  supabase: SupabaseClient,
  user_id: string,
) {
  const { data: participants, error } = await supabase
    .from("participants")
    .select("*")
    .eq("user_id", user_id);

  if (error && error.code !== "PGRST116") {
    console.error("Error checking participant existence:", error);
    throw error;
  }

  if (participants?.length === 0) {
    await supabase.from("participants").insert({
      user_id: user_id,
      room_id: zeroUuid,
    });
  }
}

async function ensureRoomExists(runtime: BgentRuntime, user_id: UUID) {
  const rooms = await runtime.databaseAdapter.getRoomsByParticipants([
    user_id,
    runtime.agentId,
  ]);

  if (rooms.length === 0) {
    const room_id = await runtime.databaseAdapter.createRoom();
    runtime.databaseAdapter.addParticipant(user_id, room_id);
    runtime.databaseAdapter.addParticipant(runtime.agentId, room_id);
    return room_id;
  }
  // else return the first room
  else {
    return rooms[0];
  }
}

const onMessage = async (
  message: Message,
  runtime: BgentRuntime,
  state?: State,
) => {
  if (!message.content) {
    logger.warn("Sender content null, skipping");
    return;
  }
  // Ensure user exists
  await ensureUserExists(
    (runtime.databaseAdapter as SupabaseDatabaseAdapter).supabase,
    message.user_id,
    `User@example.com`,
    "User",
  );

  // Ensure participant exists
  await ensureParticipantExists(
    (runtime.databaseAdapter as SupabaseDatabaseAdapter).supabase,
    message.user_id,
  );

  await ensureParticipantExists(
    (runtime.databaseAdapter as SupabaseDatabaseAdapter).supabase,
    runtime.agentId,
  );

  // // Ensure room exists
  const room_id = await ensureRoomExists(runtime, message.user_id);

  const data = (await handleMessage(
    runtime,
    { ...message, room_id },
    state,
  )) as Content;
  return data;
};

interface HandlerArgs {
  req: Request;
  env: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: string;
  };
  match?: RegExpMatchArray;
  user_id: UUID;
}

class Route {
  path;
  handler;

  constructor({
    path = /^/,
    handler,
  }: {
    path?: RegExp;
    handler: (args: HandlerArgs) => Promise<Response | null | unknown>;
  }) {
    this.path = path;
    this.handler = handler;
  }
}

const routes: Route[] = [
  {
    path: /^\/api\/agents\/message/,
    async handler({ req, env, user_id }: HandlerArgs) {
      if (req.method === "OPTIONS") {
        return;
      }

      // parse the body from the request
      const message = (await req.json()) as Message;

      const databaseAdapter = new SupabaseDatabaseAdapter(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_API_KEY,
      );

      const runtime = new BgentRuntime({
        debugMode: env.NODE_ENV === "development",
        serverUrl: "https://api.openai.com/v1",
        databaseAdapter,
        token: env.OPENAI_API_KEY,
        actions: defaultActions.filter((action) => action.name !== "ELABORATE"),
        evaluators: defaultEvaluators,
      });

      if (!(message as Message).user_id) {
        (message as Message).user_id = user_id;
      }

      try {
        await onMessage(message as Message, runtime);
      } catch (error) {
        console.error("error", error);
        return new Response(error as string, { status: 500 });
      }

      return new Response("ok", { status: 200 });
    },
  },
];

async function handleRequest(
  req: Request,
  env: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: string;
  },
) {
  const { pathname } = new URL(req.url);

  if (req.method === "OPTIONS") {
    return _setHeaders(
      new Response("", {
        status: 204,
        statusText: "OK",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "*",
        },
      }),
    );
  }

  for (const { path, handler } of routes) {
    const matchUrl = pathname.match(path as RegExp);

    if (matchUrl) {
      try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        const out = (token && jwt.decode(token)) as {
          payload: { sub: string; id: string };
          id: string;
        };

        const user_id = out?.payload?.sub || out?.payload?.id || out?.id;

        if (!user_id) {
          return _setHeaders(new Response("Unauthorized", { status: 401 }));
        }

        if (!user_id) {
          console.log(
            "Warning, user_id is null, which means the token was not decoded properly. This will need to be fixed for security reasons.",
          );
        }

        const response = await handler({
          req,
          env,
          match: matchUrl,
          user_id: user_id as UUID,
        });

        return response;
      } catch (err) {
        return _setHeaders(new Response(err as string, { status: 500 }));
      }
    }
  }

  // Default handler if no other routes are called
  return _setHeaders(
    new Response(
      JSON.stringify({ content: "No handler found for this path" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    ),
  );
}

export const fetch = async (
  request: Request,
  env: {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_API_KEY: string;
    OPENAI_API_KEY: string;
    NODE_ENV: string;
  },
) => {
  try {
    const res = (await handleRequest(request, env)) as Response;
    return _setHeaders(res); // Ensure _setHeaders modifies the response and returns it
  } catch (error) {
    // Catch any errors that occur during handling and return a Response object
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function _setHeaders(res: Response) {
  const defaultHeaders = [
    {
      key: "Access-Control-Allow-Origin",
      value: "*",
    },
    {
      key: "Access-Control-Allow-Methods",
      value: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    },
    {
      key: "Access-Control-Allow-Headers",
      value: "*",
    },
    {
      key: "Access-Control-Expose-Headers",
      value: "*",
    },
    {
      key: "Access-Control-Allow-Private-Network",
      value: "true",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Cross-Origin-Embedder-Policy",
      value: "require-corp",
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "cross-origin",
    },
  ];

  for (const { key, value } of defaultHeaders) {
    // if res.headers doesnt contain, add
    if (!res.headers.has(key)) res.headers.append(key, value);
  }
  return res;
}

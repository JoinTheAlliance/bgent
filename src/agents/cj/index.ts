import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { type UUID } from "crypto";
import logger from "../../lib/logger";
import { BgentRuntime } from "../../lib/runtime";
import {
  type Content,
  type Memory,
  type Message,
  type State,
} from "../../lib/types";
import actions from "./actions";
import evaluators from "./evaluators";
import flavor from "./flavor";
import { defaultActions, defaultEvaluators } from "../../lib";

export function shouldSkipMessage(state: State, agentId: string): boolean {
  if (state.recentMessagesData && state.recentMessagesData.length > 2) {
    const currentMessages = state.recentMessagesData ?? [];
    const lastThreeMessages = currentMessages.slice(-3);
    const lastThreeMessagesFromAgent = lastThreeMessages.filter(
      (message: Memory) => message.user_id === agentId,
    );
    if (lastThreeMessagesFromAgent.length === 3) {
      return true;
    }

    const lastTwoMessagesFromAgent = lastThreeMessagesFromAgent.slice(-2);
    const lastTwoMessagesFromAgentWithWaitAction =
      lastTwoMessagesFromAgent.filter(
        (message: Memory) => (message.content as Content).action === "WAIT",
      );
    if (lastTwoMessagesFromAgentWithWaitAction.length === 2) {
      return true;
    }
  }
  return false;
}

const onMessage = async (
  message: Message,
  runtime: BgentRuntime,
  state?: State,
) => {
  const { content: senderContent, senderId, agentId } = message;

  if (!message.userIds) {
    message.userIds = [senderId!, agentId!];
  }

  if (!senderContent) {
    logger.warn("Sender content null, skipping");
    return;
  }

  const data = (await runtime.handleRequest(message, state)) as Content;
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
  userId: UUID;
  supabase: SupabaseClient;
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
    async handler({ req, env, userId, supabase }: HandlerArgs) {
      if (req.method === "OPTIONS") {
        return;
      }

      const message = await req.json();

      console.log("NODE_ENV", env.NODE_ENV);

      const runtime = new BgentRuntime({
        debugMode: env.NODE_ENV === "development",
        serverUrl: "https://api.openai.com/v1",
        supabase,
        token: env.OPENAI_API_KEY,
        actions: [...actions, ...defaultActions],
        evaluators: [...evaluators, ...defaultEvaluators],
        flavor,
      });

      if (!(message as Message).agentId) {
        return new Response("agentId is required", { status: 400 });
      }

      if (!(message as Message).senderId) {
        (message as Message).senderId = userId;
      }

      if (!(message as Message).userIds) {
        (message as Message).userIds = [
          (message as Message).senderId!,
          (message as Message).agentId!,
        ];
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
  {
    path: /^\/api\/agents\/update/,
    async handler({ req, env, supabase }: HandlerArgs) {
      if (req.method === "OPTIONS") {
        return;
      }

      const message = (await req.json()) as Message;

      const runtime = new BgentRuntime({
        debugMode: false,
        serverUrl: "https://api.openai.com/v1",
        supabase,
        token: env.OPENAI_API_KEY,
        actions,
        evaluators,
        flavor,
      });

      if (!message.agentId) {
        return new Response("agentId is required", { status: 400 });
      }

      if (!message.userIds) {
        if (message.senderId) {
          (message as Message).userIds.push(message.senderId);
        }
        message.userIds = [message.agentId!];
      }

      const state = await runtime.composeState(message);

      if (shouldSkipMessage(state, message.agentId)) return;

      return await onMessage(message, runtime, state);
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
        const supabase = createClient(
          env.SUPABASE_URL,
          env.SUPABASE_SERVICE_API_KEY,
          {
            auth: {
              persistSession: false,
            },
          },
        );

        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        const out = (token && jwt.decode(token)) as {
          payload: { sub: string; id: string };
          id: string;
        };

        const userId = out?.payload?.sub || out?.payload?.id || out?.id;

        if (!userId) {
          return _setHeaders(new Response("Unauthorized", { status: 401 }));
        }

        if (!userId) {
          console.log(
            "Warning, userId is null, which means the token was not decoded properly. This will need to be fixed for security reasons.",
          );
        }

        const response = await handler({
          req,
          env,
          match: matchUrl,
          userId: userId as UUID,
          supabase,
        });

        return response;
      } catch (err) {
        return _setHeaders(new Response(err as string, { status: 500 }));
      }
    }
  }

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
    return _setHeaders(res);
  } catch (error) {
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
    if (!res.headers.has(key)) res.headers.append(key, value);
  }
  return res;
}

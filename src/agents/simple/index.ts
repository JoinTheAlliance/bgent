import jwt from "@tsndr/cloudflare-worker-jwt";
import { type UUID } from "crypto";
import { composeContext } from "../../lib/context";
import { embeddingZeroVector } from "../../lib/memory";

import { SupabaseDatabaseAdapter } from "../../lib/adapters/supabase";
import logger from "../../lib/logger";
import { BgentRuntime } from "../../lib/runtime";
import { messageHandlerTemplate } from "../../lib/templates";
import { type Content, type Message, type State } from "../../lib/types";
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
  const _saveRequestMessage = async (message: Message, state: State) => {
    const { content: senderContent, senderId, userIds, room_id } = message;

    const _senderContent = (
      (senderContent as Content).content ?? senderContent
    )?.trim();
    if (_senderContent) {
      await runtime.messageManager.createMemory({
        user_ids: userIds!,
        user_id: senderId!,
        content: {
          content: _senderContent,
          action: (message.content as Content)?.action ?? "null",
        },
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
  const { senderId, room_id, userIds: user_ids, agentId } = message;

  for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
    const response = await runtime.completion({
      context,
      stop: [],
    });

    runtime.databaseAdapter.log({
      body: { message, context, response },
      user_id: senderId,
      room_id,
      user_ids: user_ids!,
      agent_id: agentId!,
      type: "simple_agent_main_completion",
    });

    const parsedResponse = parseJSONObjectFromText(
      response,
    ) as unknown as Content;

    if (
      (parsedResponse.user as string)?.includes(
        (state as State).agentName as string,
      )
    ) {
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
    const { agentId, userIds, room_id } = message;

    responseContent.content = responseContent.content?.trim();

    if (responseContent.content) {
      await runtime.messageManager.createMemory({
        user_ids: userIds!,
        user_id: agentId!,
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

  const data = (await handleMessage(runtime, message, state)) as Content;
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
    async handler({ req, env, userId }: HandlerArgs) {
      if (req.method === "OPTIONS") {
        return;
      }

      // parse the body from the request
      const message = await req.json();

      const databaseAdapter = new SupabaseDatabaseAdapter(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_API_KEY,
      );

      const runtime = new BgentRuntime({
        debugMode: env.NODE_ENV === "development",
        serverUrl: "https://api.openai.com/v1",
        databaseAdapter,
        token: env.OPENAI_API_KEY,
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

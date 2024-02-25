import { type SupabaseClient } from "@supabase/supabase-js";
import { composeContext } from "./context";
import {
  defaultEvaluators,
  evaluationTemplate,
  formatEvaluatorConditions,
  formatEvaluatorExamples,
  formatEvaluatorNames,
  formatEvaluators,
} from "./evaluators";
import logger from "./logger";
import { MemoryManager, embeddingZeroVector } from "./memory";
import { messageHandlerTemplate } from "./templates";
import {
  Content,
  Goal,
  State,
  type Action,
  type Evaluator,
  type Message,
  Provider,
} from "./types";
import { parseJSONObjectFromText, parseJsonArrayFromText } from "./utils";

import {
  composeActionExamples,
  formatActionConditions,
  formatActionNames,
  formatActions,
} from "./actions";
// import { formatGoalsAsString, getGoals } from "./goals";
import { formatSummarizations } from "./evaluators/summarization";
import { formatGoalsAsString, getGoals } from "./goals";
import { formatActors, formatMessages, getActorDetails } from "./messages";
import { type Actor, /*type Goal,*/ type Memory } from "./types";
import { getLore, formatLore } from "./lore";
import { defaultProviders, getProviders } from "./providers";

/**
 * Represents the runtime environment for an agent, handling message processing,
 * action registration, and interaction with external services like OpenAI and Supabase.
 */
export class BgentRuntime {
  /**
   * Default count for recent messages to be kept in memory.
   * @private
   */
  readonly #recentMessageCount = 32 as number;
  /**
   * The base URL of the server where the agent's requests are processed.
   */
  serverUrl = "http://localhost:7998";

  /**
   * Authentication token used for securing requests.
   */
  token: string | null;

  /**
   * Indicates if debug messages should be logged.
   */
  debugMode: boolean;

  /**
   * The Supabase client used for database interactions.
   */
  supabase: SupabaseClient;

  /**
   * A string to customize the agent's behavior or responses.
   */
  flavor: string = "";

  /**
   * Custom actions that the agent can perform.
   */
  actions: Action[] = [];

  /**
   * Evaluators used to assess and guide the agent's responses.
   */
  evaluators: Evaluator[] = [];

  /**
   * Context providers used to provide context for message generation.
   */
  providers: Provider[] = [];

  /**
   * Store messages that are sent and received by the agent.
   */
  messageManager: MemoryManager = new MemoryManager({
    runtime: this,
    tableName: "messages",
  });

  /**
   * Store and recall descriptions of users based on conversations.
   */
  descriptionManager: MemoryManager = new MemoryManager({
    runtime: this,
    tableName: "descriptions",
  });

  /**
   * Manage the summarization and recall of facts.
   */
  summarizationManager: MemoryManager = new MemoryManager({
    runtime: this,
    tableName: "summarizations",
  });

  /**
   * Manage the creation and recall of static information (documents, historical game lore, etc)
   */
  loreManager: MemoryManager = new MemoryManager({
    runtime: this,
    tableName: "lore",
  });

  /**
   * Creates an instance of BgentRuntime.
   * @param opts - The options for configuring the BgentRuntime.
   * @param opts.recentMessageCount - The number of messages to hold in the recent message cache.
   * @param opts.token - The JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker.
   * @param opts.supabase - The Supabase client.
   * @param opts.debugMode - If true, debug messages will be logged.
   * @param opts.serverUrl - The URL of the worker.
   * @param opts.flavor - Optional lore to inject into the default prompt.
   * @param opts.actions - Optional custom actions.
   * @param opts.evaluators - Optional custom evaluators.
   * @param opts.providers - Optional context providers.
   */
  constructor(opts: {
    recentMessageCount?: number; // number of messages to hold in the recent message cache
    token: string; // JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker
    supabase: SupabaseClient; // Supabase client
    debugMode?: boolean; // If true, will log debug messages
    serverUrl?: string; // The URL of the worker
    flavor?: string; // Optional lore to inject into the default prompt
    actions?: Action[]; // Optional custom actions
    evaluators?: Evaluator[]; // Optional custom evaluators
    providers?: Provider[];
  }) {
    this.#recentMessageCount =
      opts.recentMessageCount ?? this.#recentMessageCount;
    this.debugMode = opts.debugMode ?? false;
    this.supabase = opts.supabase;
    this.serverUrl = opts.serverUrl ?? this.serverUrl;
    this.flavor = opts.flavor ?? "";
    if (!this.serverUrl) {
      console.warn("No serverUrl provided, defaulting to localhost");
    }

    this.token = opts.token;

    (opts.actions ?? []).forEach((action) => {
      this.registerAction(action);
    });

    (opts.evaluators ?? defaultEvaluators).forEach((evaluator) => {
      this.registerEvaluator(evaluator);
    });
    (opts.providers ?? defaultProviders).forEach((provider) => {
      this.registerContextProvider(provider);
    });
  }

  /**
   * Get the number of messages that are kept in the conversation buffer.
   * @returns The number of recent messages to be kept in memory.
   */
  getRecentMessageCount() {
    return this.#recentMessageCount;
  }

  /**
   * Register an action for the agent to perform.
   * @param action The action to register.
   */
  registerAction(action: Action) {
    this.actions.push(action);
  }

  /**
   * Register an evaluator to assess and guide the agent's responses.
   * @param evaluator The evaluator to register.
   */
  registerEvaluator(evaluator: Evaluator) {
    this.evaluators.push(evaluator);
  }

  /**
   * Register a context provider to provide context for message generation.
   * @param provider The context provider to register.
   */
  registerContextProvider(provider: Provider) {
    this.providers.push(provider);
  }

  /**
   * Send a message to the OpenAI API for completion.
   * @param opts - The options for the completion request.
   * @param opts.context The context of the message to be completed.
   * @param opts.stop A list of strings to stop the completion at.
   * @param opts.model The model to use for completion.
   * @param opts.frequency_penalty The frequency penalty to apply to the completion.
   * @param opts.presence_penalty The presence penalty to apply to the completion.
   * @returns The completed message.
   */
  async completion({
    context = "",
    stop = [],
    model = "gpt-3.5-turbo-0125",
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
  }) {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        stop,
        model,
        frequency_penalty,
        presence_penalty,
        messages: [
          {
            role: "user",
            content: context,
          },
        ],
      }),
    };

    try {
      const response = await fetch(
        `${this.serverUrl}/chat/completions`,
        requestOptions,
      );

      if (!response.ok) {
        throw new Error(
          "OpenAI API Error: " + response.status + " " + response.statusText,
        );
      }

      const body = await response.json();

      interface OpenAIResponse {
        choices: Array<{ message: { content: string } }>;
      }

      const content = (body as OpenAIResponse).choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      return content;
    } catch (error) {
      console.error("ERROR:", error);
      throw new Error(error as string);
    }
  }

  /**
   * Send a message to the OpenAI API for embedding.
   * @param input The input to be embedded.
   * @returns The embedding of the input.
   */
  async embed(input: string) {
    const embeddingModel = "text-embedding-3-large";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        input,
        model: embeddingModel,
      }),
    };
    try {
      const response = await fetch(
        `${this.serverUrl}/embeddings`,
        requestOptions,
      );

      if (!response.ok) {
        throw new Error(
          "OpenAI API Error: " + response.status + " " + response.statusText,
        );
      }

      interface OpenAIEmbeddingResponse {
        data: Array<{ embedding: number[] }>;
      }

      const data: OpenAIEmbeddingResponse = await response.json();

      return data?.data?.[0].embedding;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Handle an incoming message, processing it and returning a response.
   * @param message The message to handle.
   * @param state The state of the agent.
   * @returns The response to the message.
   */
  async handleMessage(message: Message, state?: State) {
    const _saveRequestMessage = async (message: Message, state: State) => {
      const { content: senderContent, senderId, userIds, room_id } = message;

      const _senderContent = (
        (senderContent as Content).content ?? senderContent
      )?.trim();
      if (_senderContent) {
        await this.messageManager.createMemory({
          user_ids: userIds!,
          user_id: senderId!,
          content: {
            content: _senderContent,
            action: (message.content as Content)?.action ?? "null",
          },
          room_id,
          embedding: embeddingZeroVector,
        });
        await this.evaluate(message, state);
      }
    };

    await _saveRequestMessage(message, state as State);
    if (!state) {
      state = (await this.composeState(message)) as State;
    }

    const context = composeContext({
      state,
      template: messageHandlerTemplate,
    });

    if (this.debugMode) {
      logger.log(context, "Response Context", "cyan");
    }

    let responseContent: Content | null = null;
    const { senderId, room_id, userIds: user_ids, agentId } = message;

    for (let triesLeft = 3; triesLeft > 0; triesLeft--) {
      const response = await this.completion({
        context,
        stop: [],
      });

      this.supabase
        .from("logs")
        .insert({
          body: { message, context, response },
          user_id: senderId,
          room_id,
          user_ids: user_ids!,
          agent_id: agentId!,
          type: "main_completion",
        })
        .then(({ error }) => {
          if (error) {
            console.error("error", error);
          }
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
        await this.messageManager.createMemory({
          user_ids: userIds!,
          user_id: agentId!,
          content: responseContent,
          room_id,
          embedding: embeddingZeroVector,
        });
        await this.evaluate(message, { ...state, responseContent });
      } else {
        console.warn("Empty response, skipping");
      }
    };

    await _saveResponseMessage(message, state, responseContent);
    await this.processActions(message, responseContent);

    return responseContent;
  }

  /**
   * Process the actions of a message.
   * @param message The message to process.
   * @param content The content of the message to process actions from.
   */
  async processActions(message: Message, content: Content) {
    if (!content.action) {
      return;
    }

    const action = this.actions.find(
      (a: { name: string }) => a.name === content.action,
    )!;

    if (!action) {
      return console.warn("No action found for", content.action);
    }

    if (!action.handler) {
      if (this.debugMode) {
        logger.log(
          `No handler found for action ${action.name}, skipping`,
          "",
          "yellow",
        );
      }
      return;
    }

    await action.handler(this, message);
  }

  /**
   * Evaluate the message and state using the registered evaluators.
   * @param message The message to evaluate.
   * @param state The state of the agent.
   * @returns The results of the evaluation.
   */
  async evaluate(message: Message, state: State) {
    const evaluatorPromises = this.evaluators.map(
      async (evaluator: Evaluator) => {
        if (!evaluator.handler) {
          return null;
        }

        const result = await evaluator.validate(this, message, state);
        if (result) {
          return evaluator;
        }
        return null;
      },
    );

    const resolvedEvaluators = await Promise.all(evaluatorPromises);
    const evaluatorsData = resolvedEvaluators.filter(Boolean);

    // if there are no evaluators this frame, return
    if (evaluatorsData.length === 0) {
      return [];
    }

    const evaluators = formatEvaluators(evaluatorsData as Evaluator[]);
    const evaluatorNames = formatEvaluatorNames(evaluatorsData as Evaluator[]);
    const evaluatorConditions = formatEvaluatorConditions(
      evaluatorsData as Evaluator[],
    );

    const context = composeContext({
      state: { ...state, evaluators, evaluatorNames, evaluatorConditions },
      template: evaluationTemplate,
    });

    const result = await this.completion({
      context,
    });

    const parsedResult = parseJsonArrayFromText(result) as unknown as string[];

    this.evaluators
      .filter((evaluator: Evaluator) => parsedResult?.includes(evaluator.name))
      .forEach((evaluator: Evaluator) => {
        if (!evaluator?.handler) return;

        evaluator.handler(this, message);
      });

    return parsedResult;
  }

  /**
   * Compose the state of the agent into an object that can be passed or used for response generation.
   * @param message The message to compose the state from.
   * @returns The state of the agent.
   */
  async composeState(message: Message) {
    const { senderId, agentId, userIds, room_id } = message;

    const recentMessageCount = this.getRecentMessageCount();
    const recentSummarizationsCount = Math.ceil(
      this.getRecentMessageCount() / 2,
    );
    const relevantSummarizationsCount = Math.ceil(
      this.getRecentMessageCount() / 2,
    );

    const [
      actorsData,
      recentMessagesData,
      recentSummarizationsData,
      goalsData,
      loreData,
      providers,
    ]: [Actor[], Memory[], Memory[], Goal[], Memory[], string] =
      await Promise.all([
        getActorDetails({ runtime: this, userIds: userIds! }),
        this.messageManager.getMemoriesByIds({
          userIds: userIds!,
          count: recentMessageCount,
          unique: false,
        }),
        this.summarizationManager.getMemoriesByIds({
          userIds: userIds!,
          count: recentSummarizationsCount,
        }),
        getGoals({
          runtime: this,
          count: 10,
          onlyInProgress: true,
          userIds: userIds!,
        }),
        getLore({
          runtime: this,
          message: (message.content as Content).content,
          count: 5,
          match_threshold: 0.5,
        }),
        getProviders(this, message),
      ]);

    const goals = await formatGoalsAsString({ goals: goalsData });

    let relevantSummarizationsData: Memory[] = [];

    if (recentSummarizationsData.length > recentSummarizationsCount) {
      relevantSummarizationsData = (
        await this.summarizationManager.searchMemoriesByEmbedding(
          recentSummarizationsData[0].embedding!,
          {
            userIds: userIds!,
            count: relevantSummarizationsCount,
          },
        )
      ).filter((summarization: Memory) => {
        return !recentSummarizationsData.find(
          (recentSummarization: Memory) =>
            recentSummarization.id === summarization.id,
        );
      });
    }

    const actors = formatActors({ actors: actorsData ?? [] });

    const recentMessages = formatMessages({
      actors: actorsData ?? [],
      messages: recentMessagesData.map((memory: Memory) => {
        const newMemory = { ...memory };
        delete newMemory.embedding;
        return newMemory;
      }),
    });

    const recentSummarizations = formatSummarizations(recentSummarizationsData);
    const relevantSummarizations = formatSummarizations(
      relevantSummarizationsData,
    );

    const lore = formatLore(loreData);

    const senderName = actorsData?.find(
      (actor: Actor) => actor.id === senderId,
    )?.name;
    const agentName = actorsData?.find(
      (actor: Actor) => actor.id === agentId,
    )?.name;

    const initialState = {
      userIds,
      agentId,
      agentName,
      senderName,
      actors,
      actorsData,
      room_id,
      goals,
      lore,
      loreData,
      providers,
      goalsData,
      flavor: this.flavor,
      recentMessages,
      recentMessagesData,
      recentSummarizations,
      recentSummarizationsData,
      relevantSummarizations,
      relevantSummarizationsData,
    };

    const actionPromises = this.actions.map(async (action: Action) => {
      const result = await action.validate(this, message);
      if (result) {
        return action;
      }
      return null;
    });

    const evaluatorPromises = this.evaluators.map(async (evaluator) => {
      const result = await evaluator.validate(this, message, initialState);
      if (result) {
        return evaluator;
      }
      return null;
    });

    const resolvedEvaluators = await Promise.all(evaluatorPromises);

    const evaluatorsData = resolvedEvaluators.filter(Boolean) as Evaluator[];
    const evaluators = formatEvaluators(evaluatorsData);
    const evaluatorNames = formatEvaluatorNames(evaluatorsData);
    const evaluatorConditions = formatEvaluatorConditions(evaluatorsData);
    const evaluatorExamples = formatEvaluatorExamples(evaluatorsData);

    const resolvedActions = await Promise.all(actionPromises);

    const actionsData = resolvedActions.filter(Boolean) as Action[];

    const actionState = {
      actionNames: formatActionNames(actionsData),
      actionConditions: formatActionConditions(actionsData),
      actions: formatActions(actionsData),
      actionExamples: composeActionExamples(actionsData, 10),
      evaluatorsData,
      evaluators,
      evaluatorNames,
      evaluatorConditions,
      evaluatorExamples,
    };

    return { ...initialState, ...actionState };
  }
}

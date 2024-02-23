---
id: "BgentRuntime"
title: "Class: BgentRuntime"
sidebar_label: "BgentRuntime"
sidebar_position: 0
custom_edit_url: null
---

Represents the runtime environment for an agent, handling message processing,
action registration, and interaction with external services like OpenAI and Supabase.

## Constructors

### constructor

• **new BgentRuntime**(`opts`): [`BgentRuntime`](BgentRuntime.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `Object` |
| `opts.actions?` | [`Action`](../interfaces/Action.md)[] |
| `opts.debugMode?` | `boolean` |
| `opts.evaluators?` | [`Evaluator`](../interfaces/Evaluator.md)[] |
| `opts.flavor?` | `string` |
| `opts.recentMessageCount?` | `number` |
| `opts.serverUrl?` | `string` |
| `opts.supabase` | `default`\<`any`, ``"public"``, `any`\> |
| `opts.token` | `string` |

#### Returns

[`BgentRuntime`](BgentRuntime.md)

## Properties

### actions

• **actions**: [`Action`](../interfaces/Action.md)[] = `[]`

Custom actions that the agent can perform.

___

### debugMode

• **debugMode**: `boolean`

Indicates if debug messages should be logged.

___

### descriptionManager

• **descriptionManager**: [`MemoryManager`](MemoryManager.md)

Store and recall descriptions of users based on conversations.

___

### evaluators

• **evaluators**: [`Evaluator`](../interfaces/Evaluator.md)[] = `[]`

Evaluators used to assess and guide the agent's responses.

___

### flavor

• **flavor**: `string` = `""`

A string to customize the agent's behavior or responses.

___

### loreManager

• **loreManager**: [`MemoryManager`](MemoryManager.md)

Manage the creation and recall of static information (documents, historical game lore, etc)

___

### messageManager

• **messageManager**: [`MemoryManager`](MemoryManager.md)

Store messages that are sent and received by the agent.

___

### serverUrl

• **serverUrl**: `string` = `"http://localhost:7998"`

The base URL of the server where the agent's requests are processed.

___

### summarizationManager

• **summarizationManager**: [`MemoryManager`](MemoryManager.md)

Manage the summarization and recall of facts.

___

### supabase

• **supabase**: `default`\<`any`, ``"public"``, `any`\>

The Supabase client used for database interactions.

___

### token

• **token**: ``null`` \| `string`

Authentication token used for securing requests.

## Methods

### completion

▸ **completion**(`«destructured»`): `Promise`\<`string`\>

Send a message to the OpenAI API for completion.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `context` | `undefined` \| `string` | `""` |
| › `frequency_penalty` | `undefined` \| `number` | `0.0` |
| › `model` | `undefined` \| `string` | `"gpt-3.5-turbo-0125"` |
| › `presence_penalty` | `undefined` \| `number` | `0.0` |
| › `stop` | `undefined` \| `never`[] | `[]` |

#### Returns

`Promise`\<`string`\>

The completed message.

___

### composeState

▸ **composeState**(`message`): `Promise`\<\{ `actionConditions`: `string` ; `actionExamples`: `string` ; `actionNames`: `string` ; `actions`: `string` ; `actors`: `string` ; `actorsData`: [`Actor`](../interfaces/Actor.md)[] ; `agentId`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` ; `agentName`: `undefined` \| `string` ; `evaluatorConditions`: `string` ; `evaluatorExamples`: `string` ; `evaluatorNames`: `string` ; `evaluators`: `string` ; `evaluatorsData`: [`Evaluator`](../interfaces/Evaluator.md)[] ; `flavor`: `string` ; `goals`: `string` ; `goalsData`: [`Goal`](../interfaces/Goal.md)[] ; `lore`: `string` ; `loreData`: [`Memory`](../interfaces/Memory.md)[] ; `recentMessages`: `string` ; `recentMessagesData`: [`Memory`](../interfaces/Memory.md)[] ; `recentSummarizations`: `string` ; `recentSummarizationsData`: [`Memory`](../interfaces/Memory.md)[] ; `relevantSummarizations`: `string` ; `relevantSummarizationsData`: [`Memory`](../interfaces/Memory.md)[] ; `room_id`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` ; `senderName`: `undefined` \| `string` ; `userIds`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]  }\>

Compose the state of the agent into an object that can be passed or used for response generation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`Message`](../interfaces/Message.md) | The message to compose the state from. |

#### Returns

`Promise`\<\{ `actionConditions`: `string` ; `actionExamples`: `string` ; `actionNames`: `string` ; `actions`: `string` ; `actors`: `string` ; `actorsData`: [`Actor`](../interfaces/Actor.md)[] ; `agentId`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` ; `agentName`: `undefined` \| `string` ; `evaluatorConditions`: `string` ; `evaluatorExamples`: `string` ; `evaluatorNames`: `string` ; `evaluators`: `string` ; `evaluatorsData`: [`Evaluator`](../interfaces/Evaluator.md)[] ; `flavor`: `string` ; `goals`: `string` ; `goalsData`: [`Goal`](../interfaces/Goal.md)[] ; `lore`: `string` ; `loreData`: [`Memory`](../interfaces/Memory.md)[] ; `recentMessages`: `string` ; `recentMessagesData`: [`Memory`](../interfaces/Memory.md)[] ; `recentSummarizations`: `string` ; `recentSummarizationsData`: [`Memory`](../interfaces/Memory.md)[] ; `relevantSummarizations`: `string` ; `relevantSummarizationsData`: [`Memory`](../interfaces/Memory.md)[] ; `room_id`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` ; `senderName`: `undefined` \| `string` ; `userIds`: \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]  }\>

The state of the agent.

___

### embed

▸ **embed**(`input`): `Promise`\<`number`[]\>

Send a message to the OpenAI API for embedding.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | The input to be embedded. |

#### Returns

`Promise`\<`number`[]\>

The embedding of the input.

___

### evaluate

▸ **evaluate**(`message`, `state`): `Promise`\<``null`` \| `any`[]\>

Evaluate the message and state using the registered evaluators.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`Message`](../interfaces/Message.md) | The message to evaluate. |
| `state` | [`State`](../interfaces/State.md) | The state of the agent. |

#### Returns

`Promise`\<``null`` \| `any`[]\>

The results of the evaluation.

___

### getRecentMessageCount

▸ **getRecentMessageCount**(): `number`

Get the number of messages that are kept in the conversation buffer.

#### Returns

`number`

The number of recent messages to be kept in memory.

___

### handleMessage

▸ **handleMessage**(`message`, `state?`): `Promise`\<`any`\>

Handle an incoming message, processing it and returning a response.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`Message`](../interfaces/Message.md) | The message to handle. |
| `state?` | [`State`](../interfaces/State.md) | The state of the agent. |

#### Returns

`Promise`\<`any`\>

The response to the message.

___

### processActions

▸ **processActions**(`message`, `content`): `Promise`\<`void`\>

Process the actions of a message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`Message`](../interfaces/Message.md) | The message to process. |
| `content` | [`Content`](../interfaces/Content.md) | The content of the message to process actions from. |

#### Returns

`Promise`\<`void`\>

___

### registerAction

▸ **registerAction**(`action`): `void`

Register an action for the agent to perform.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `action` | [`Action`](../interfaces/Action.md) | The action to register. |

#### Returns

`void`

___

### registerEvaluator

▸ **registerEvaluator**(`evaluator`): `void`

Register an evaluator to assess and guide the agent's responses.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `evaluator` | [`Evaluator`](../interfaces/Evaluator.md) | The evaluator to register. |

#### Returns

`void`

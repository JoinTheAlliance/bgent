---
id: "SupabaseDatabaseAdapter"
title: "Class: SupabaseDatabaseAdapter"
sidebar_label: "SupabaseDatabaseAdapter"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- [`DatabaseAdapter`](DatabaseAdapter.md)

  ↳ **`SupabaseDatabaseAdapter`**

## Constructors

### constructor

• **new SupabaseDatabaseAdapter**(`supabaseUrl`, `supabaseKey`): [`SupabaseDatabaseAdapter`](SupabaseDatabaseAdapter.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `supabaseUrl` | `string` |
| `supabaseKey` | `string` |

#### Returns

[`SupabaseDatabaseAdapter`](SupabaseDatabaseAdapter.md)

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[constructor](DatabaseAdapter.md#constructor)

## Methods

### addParticipantToRoom

▸ **addParticipantToRoom**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `roomId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[addParticipantToRoom](DatabaseAdapter.md#addparticipanttoroom)

___

### countMemories

▸ **countMemories**(`room_id`, `unique?`, `tableName`): `Promise`\<`number`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` | `undefined` |
| `unique` | `boolean` | `true` |
| `tableName` | `string` | `undefined` |

#### Returns

`Promise`\<`number`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[countMemories](DatabaseAdapter.md#countmemories)

___

### createAccount

▸ **createAccount**(`account`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | [`Account`](../interfaces/Account.md) |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[createAccount](DatabaseAdapter.md#createaccount)

___

### createGoal

▸ **createGoal**(`goal`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goal` | [`Goal`](../interfaces/Goal.md) |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[createGoal](DatabaseAdapter.md#creategoal)

___

### createMemory

▸ **createMemory**(`memory`, `tableName`, `unique?`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `memory` | [`Memory`](../interfaces/Memory.md) | `undefined` |
| `tableName` | `string` | `undefined` |
| `unique` | `boolean` | `false` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[createMemory](DatabaseAdapter.md#creatememory)

___

### createRelationship

▸ **createRelationship**(`params`): `Promise`\<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.userA` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.userB` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`boolean`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[createRelationship](DatabaseAdapter.md#createrelationship)

___

### createRoom

▸ **createRoom**(`name`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[createRoom](DatabaseAdapter.md#createroom)

___

### getAccountById

▸ **getAccountById**(`userId`): `Promise`\<``null`` \| [`Account`](../interfaces/Account.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<``null`` \| [`Account`](../interfaces/Account.md)\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getAccountById](DatabaseAdapter.md#getaccountbyid)

___

### getActorDetails

▸ **getActorDetails**(`params`): `Promise`\<[`Actor`](../interfaces/Actor.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Actor`](../interfaces/Actor.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getActorDetails](DatabaseAdapter.md#getactordetails)

___

### getCachedEmbeddings

▸ **getCachedEmbeddings**(`opts`): `Promise`\<\{ `embedding`: `number`[] ; `levenshtein_score`: `number`  }[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `Object` |
| `opts.query_field_name` | `string` |
| `opts.query_field_sub_name` | `string` |
| `opts.query_input` | `string` |
| `opts.query_match_count` | `number` |
| `opts.query_table_name` | `string` |
| `opts.query_threshold` | `number` |

#### Returns

`Promise`\<\{ `embedding`: `number`[] ; `levenshtein_score`: `number`  }[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getCachedEmbeddings](DatabaseAdapter.md#getcachedembeddings)

___

### getGoals

▸ **getGoals**(`params`): `Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.count?` | `number` |
| `params.onlyInProgress?` | `boolean` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.userId?` | ``null`` \| \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getGoals](DatabaseAdapter.md#getgoals)

___

### getMemories

▸ **getMemories**(`params`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.count?` | `number` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.tableName` | `string` |
| `params.unique?` | `boolean` |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getMemories](DatabaseAdapter.md#getmemories)

___

### getRelationship

▸ **getRelationship**(`params`): `Promise`\<``null`` \| [`Relationship`](../interfaces/Relationship.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.userA` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.userB` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<``null`` \| [`Relationship`](../interfaces/Relationship.md)\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getRelationship](DatabaseAdapter.md#getrelationship)

___

### getRelationships

▸ **getRelationships**(`params`): `Promise`\<[`Relationship`](../interfaces/Relationship.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Relationship`](../interfaces/Relationship.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getRelationships](DatabaseAdapter.md#getrelationships)

___

### getRoomsByParticipant

▸ **getRoomsByParticipant**(`userId`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getRoomsByParticipant](DatabaseAdapter.md#getroomsbyparticipant)

___

### getRoomsByParticipants

▸ **getRoomsByParticipants**(`userIds`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getRoomsByParticipants](DatabaseAdapter.md#getroomsbyparticipants)

___

### log

▸ **log**(`params`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.body` | `Object` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.type` | `string` |
| `params.user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[log](DatabaseAdapter.md#log)

___

### removeAllGoals

▸ **removeAllGoals**(`room_id`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeAllGoals](DatabaseAdapter.md#removeallgoals)

___

### removeAllMemories

▸ **removeAllMemories**(`room_id`, `tableName`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `tableName` | `string` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeAllMemories](DatabaseAdapter.md#removeallmemories)

___

### removeGoal

▸ **removeGoal**(`goalId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goalId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeGoal](DatabaseAdapter.md#removegoal)

___

### removeMemory

▸ **removeMemory**(`memoryId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `memoryId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeMemory](DatabaseAdapter.md#removememory)

___

### removeParticipantFromRoom

▸ **removeParticipantFromRoom**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `roomId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeParticipantFromRoom](DatabaseAdapter.md#removeparticipantfromroom)

___

### removeRoom

▸ **removeRoom**(`roomId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `roomId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeRoom](DatabaseAdapter.md#removeroom)

___

### searchMemories

▸ **searchMemories**(`params`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.embedding` | `number`[] |
| `params.match_count` | `number` |
| `params.match_threshold` | `number` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.tableName` | `string` |
| `params.unique` | `boolean` |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[searchMemories](DatabaseAdapter.md#searchmemories)

___

### searchMemoriesByEmbedding

▸ **searchMemoriesByEmbedding**(`embedding`, `params`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `embedding` | `number`[] |
| `params` | `Object` |
| `params.count?` | `number` |
| `params.match_threshold?` | `number` |
| `params.room_id?` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.tableName` | `string` |
| `params.unique?` | `boolean` |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[searchMemoriesByEmbedding](DatabaseAdapter.md#searchmemoriesbyembedding)

___

### updateGoal

▸ **updateGoal**(`goal`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goal` | [`Goal`](../interfaces/Goal.md) |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[updateGoal](DatabaseAdapter.md#updategoal)

___

### updateGoalStatus

▸ **updateGoalStatus**(`params`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.goalId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.status` | [`GoalStatus`](../enums/GoalStatus.md) |

#### Returns

`Promise`\<`void`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[updateGoalStatus](DatabaseAdapter.md#updategoalstatus)

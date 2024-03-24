---
id: "DatabaseAdapter"
title: "Class: DatabaseAdapter"
sidebar_label: "DatabaseAdapter"
sidebar_position: 0
custom_edit_url: null
---

## Hierarchy

- **`DatabaseAdapter`**

  ↳ [`SupabaseDatabaseAdapter`](SupabaseDatabaseAdapter.md)

  ↳ [`SqliteDatabaseAdapter`](SqliteDatabaseAdapter.md)

  ↳ [`SqlJsDatabaseAdapter`](SqlJsDatabaseAdapter.md)

## Constructors

### constructor

• **new DatabaseAdapter**(): [`DatabaseAdapter`](DatabaseAdapter.md)

#### Returns

[`DatabaseAdapter`](DatabaseAdapter.md)

## Methods

### addParticipant

▸ **addParticipant**(`user_id`, `room_id`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

___

### countMemories

▸ **countMemories**(`room_id`, `unique?`, `tableName?`): `Promise`\<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `unique?` | `boolean` |
| `tableName?` | `string` |

#### Returns

`Promise`\<`number`\>

___

### createAccount

▸ **createAccount**(`account`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | [`Account`](../interfaces/Account.md) |

#### Returns

`Promise`\<`void`\>

___

### createGoal

▸ **createGoal**(`goal`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goal` | [`Goal`](../interfaces/Goal.md) |

#### Returns

`Promise`\<`void`\>

___

### createMemory

▸ **createMemory**(`memory`, `tableName`, `unique?`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `memory` | [`Memory`](../interfaces/Memory.md) |
| `tableName` | `string` |
| `unique?` | `boolean` |

#### Returns

`Promise`\<`void`\>

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

___

### createRoom

▸ **createRoom**(`room_id?`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id?` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`\>

___

### getAccountById

▸ **getAccountById**(`user_id`): `Promise`\<``null`` \| [`Account`](../interfaces/Account.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<``null`` \| [`Account`](../interfaces/Account.md)\>

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

___

### getCachedEmbeddings

▸ **getCachedEmbeddings**(`«destructured»`): `Promise`\<\{ `embedding`: `number`[] ; `levenshtein_score`: `number`  }[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `query_field_name` | `string` |
| › `query_field_sub_name` | `string` |
| › `query_input` | `string` |
| › `query_match_count` | `number` |
| › `query_table_name` | `string` |
| › `query_threshold` | `number` |

#### Returns

`Promise`\<\{ `embedding`: `number`[] ; `levenshtein_score`: `number`  }[]\>

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
| `params.user_id?` | ``null`` \| \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

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

___

### getRelationships

▸ **getRelationships**(`params`): `Promise`\<[`Relationship`](../interfaces/Relationship.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Relationship`](../interfaces/Relationship.md)[]\>

___

### getRoomsByParticipant

▸ **getRoomsByParticipant**(`user_id`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

___

### getRoomsByParticipants

▸ **getRoomsByParticipants**(`userIds`): `Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<\`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[]\>

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

___

### removeAllGoals

▸ **removeAllGoals**(`room_id`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

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

___

### removeGoal

▸ **removeGoal**(`goalId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goalId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

___

### removeMemory

▸ **removeMemory**(`memoryId`, `tableName`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `memoryId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `tableName` | `string` |

#### Returns

`Promise`\<`void`\>

___

### removeParticipantFromRoom

▸ **removeParticipantFromRoom**(`user_id`, `room_id`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

___

### removeRoom

▸ **removeRoom**(`room_id`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

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

___

### updateGoal

▸ **updateGoal**(`goal`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `goal` | [`Goal`](../interfaces/Goal.md) |

#### Returns

`Promise`\<`void`\>

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

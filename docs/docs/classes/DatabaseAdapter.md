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

## Constructors

### constructor

• **new DatabaseAdapter**(): [`DatabaseAdapter`](DatabaseAdapter.md)

#### Returns

[`DatabaseAdapter`](DatabaseAdapter.md)

## Methods

### countMemoriesByUserIds

▸ **countMemoriesByUserIds**(`userIds`, `unique?`, `tableName?`): `Promise`\<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |
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
| `account` | `Account` |

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

### getAccountById

▸ **getAccountById**(`userId`): `Promise`\<``null`` \| `Account`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<``null`` \| `Account`\>

___

### getActorDetails

▸ **getActorDetails**(`params`): `Promise`\<[`Actor`](../interfaces/Actor.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<[`Actor`](../interfaces/Actor.md)[]\>

___

### getGoals

▸ **getGoals**(`params`): `Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.count?` | `number` |
| `params.onlyInProgress?` | `boolean` |
| `params.userId?` | ``null`` \| \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<[`Goal`](../interfaces/Goal.md)[]\>

___

### getMemoriesByIds

▸ **getMemoriesByIds**(`params`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.count?` | `number` |
| `params.tableName` | `string` |
| `params.unique?` | `boolean` |
| `params.userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

___

### getMemoryByContent

▸ **getMemoryByContent**(`«destructured»`): `Promise`\<`SimilaritySearch`[]\>

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

`Promise`\<`SimilaritySearch`[]\>

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
| `params.userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<[`Relationship`](../interfaces/Relationship.md)[]\>

___

### log

▸ **log**(`params`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.agent_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.body` | `Object` |
| `params.room_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.type` | `string` |
| `params.user_id` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |
| `params.user_ids` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<`void`\>

___

### removeAllMemoriesByUserIds

▸ **removeAllMemoriesByUserIds**(`userIds`, `tableName`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |
| `tableName` | `string` |

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

### searchMemories

▸ **searchMemories**(`params`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.embedding` | `number`[] |
| `params.match_count` | `number` |
| `params.match_threshold` | `number` |
| `params.tableName` | `string` |
| `params.unique` | `boolean` |
| `params.userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

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
| `params.tableName` | `string` |
| `params.unique?` | `boolean` |
| `params.userIds?` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

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

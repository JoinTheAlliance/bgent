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

### countMemoriesByUserIds

▸ **countMemoriesByUserIds**(`userIds`, `unique?`, `tableName`): `Promise`\<`number`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] | `undefined` |
| `unique` | `boolean` | `true` |
| `tableName` | `string` | `undefined` |

#### Returns

`Promise`\<`number`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[countMemoriesByUserIds](DatabaseAdapter.md#countmemoriesbyuserids)

___

### createAccount

▸ **createAccount**(`account`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `Account` |

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

### getAccountById

▸ **getAccountById**(`userId`): `Promise`\<``null`` \| `Account`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<``null`` \| `Account`\>

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getAccountById](DatabaseAdapter.md#getaccountbyid)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getActorDetails](DatabaseAdapter.md#getactordetails)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getGoals](DatabaseAdapter.md#getgoals)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[getMemoriesByIds](DatabaseAdapter.md#getmemoriesbyids)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[log](DatabaseAdapter.md#log)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeAllMemoriesByUserIds](DatabaseAdapter.md#removeallmemoriesbyuserids)

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

#### Overrides

[DatabaseAdapter](DatabaseAdapter.md).[removeMemory](DatabaseAdapter.md#removememory)

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
| `params.tableName` | `string` |
| `params.unique?` | `boolean` |
| `params.userIds?` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

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

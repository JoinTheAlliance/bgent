---
id: "MemoryManager"
title: "Class: MemoryManager"
sidebar_label: "MemoryManager"
sidebar_position: 0
custom_edit_url: null
---

Manage memories in the database.

## Constructors

### constructor

• **new MemoryManager**(`«destructured»`): [`MemoryManager`](MemoryManager.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `runtime` | [`BgentRuntime`](BgentRuntime.md) |
| › `tableName` | `string` |

#### Returns

[`MemoryManager`](MemoryManager.md)

## Properties

### runtime

• **runtime**: [`BgentRuntime`](BgentRuntime.md)

___

### tableName

• **tableName**: `string`

## Methods

### addEmbeddingToMemory

▸ **addEmbeddingToMemory**(`memory`): `Promise`\<[`Memory`](../interfaces/Memory.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `memory` | [`Memory`](../interfaces/Memory.md) |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)\>

___

### countMemoriesByUserIds

▸ **countMemoriesByUserIds**(`userIds`, `unique?`): `Promise`\<`number`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] | `undefined` |
| `unique` | `boolean` | `true` |

#### Returns

`Promise`\<`number`\>

___

### createMemory

▸ **createMemory**(`memory`, `unique?`): `Promise`\<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `memory` | [`Memory`](../interfaces/Memory.md) | `undefined` |
| `unique` | `boolean` | `false` |

#### Returns

`Promise`\<`void`\>

___

### getMemoriesByIds

▸ **getMemoriesByIds**(`«destructured»`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `count` | `number` | `undefined` |
| › `unique?` | `boolean` | `true` |
| › `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] | `undefined` |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

___

### removeAllMemoriesByUserIds

▸ **removeAllMemoriesByUserIds**(`userIds`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<`void`\>

___

### removeMemory

▸ **removeMemory**(`memoryId`): `Promise`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `memoryId` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\` |

#### Returns

`Promise`\<`void`\>

___

### searchMemoriesByEmbedding

▸ **searchMemoriesByEmbedding**(`embedding`, `opts`): `Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `embedding` | `number`[] |
| `opts` | `Object` |
| `opts.count?` | `number` |
| `opts.match_threshold?` | `number` |
| `opts.unique?` | `boolean` |
| `opts.userIds` | \`$\{string}-$\{string}-$\{string}-$\{string}-$\{string}\`[] |

#### Returns

`Promise`\<[`Memory`](../interfaces/Memory.md)[]\>

---
id: "goal-1"
title: "Variable: goal"
sidebar_label: "goal"
sidebar_position: 0
custom_edit_url: null
---

• **goal**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `condition` | `string` |
| `description` | `string` |
| `examples` | \{ `context`: `string` ; `messages`: \{ `content`: \{ `content`: `string` = "I've just finished chapter 20 of 'War and Peace'!" } ; `user`: `string` = "\{\{user1}}" }[] ; `outcome`: `string`  }[] |
| `handler` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<[`Goal`](../interfaces/Goal.md)[]\> |
| `name` | `string` |
| `validate` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<`boolean`\> |

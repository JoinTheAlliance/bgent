---
id: "summarization"
title: "Variable: summarization"
sidebar_label: "summarization"
sidebar_position: 0
custom_edit_url: null
---

• **summarization**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `condition` | `string` |
| `description` | `string` |
| `examples` | \{ `context`: `string` ; `messages`: (\{ `action`: `string` = "WAIT"; `content`: `string` = "So where are you from?"; `user`: `string` = "\{\{user1}}" } \| \{ `action?`: `undefined` = "WAIT"; `content`: `string` = "I'm from the city."; `user`: `string` = "\{\{user2}}" })[] ; `outcome`: `string`  }[] |
| `handler` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<`any`[]\> |
| `name` | `string` |
| `validate` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<`boolean`\> |

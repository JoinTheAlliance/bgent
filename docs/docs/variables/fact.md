---
id: "fact"
title: "Variable: fact"
sidebar_label: "fact"
sidebar_position: 0
custom_edit_url: null
---

• **fact**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `condition` | `string` |
| `description` | `string` |
| `examples` | \{ `context`: `string` ; `messages`: [`ActionExample`](../interfaces/ActionExample.md)[] ; `outcome`: `string`  }[] |
| `handler` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<`any`[]\> |
| `name` | `string` |
| `validate` | (`runtime`: [`BgentRuntime`](../classes/BgentRuntime.md), `message`: [`Message`](../interfaces/Message.md)) => `Promise`\<`boolean`\> |

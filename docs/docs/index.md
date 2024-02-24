---
id: "index"
title: "API Doc"
sidebar_label: "Readme"
sidebar_position: 0
custom_edit_url: null
---

# bgent

A flexible, scalable and customizable agent to do your bidding.

![cj](https://github.com/jointhealliance/bgent/assets/18633264/7513b5a6-2352-45f3-8b87-7ee0e2171a30)

[![npm version](https://badge.fury.io/js/bgent.svg)](https://badge.fury.io/js/bgent)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://github.com/jointhealliance/bgent/blob/main/LICENSE)
[![stars - bgent](https://img.shields.io/github/stars/jointhealliance/bgent?style=social)](https://github.com/jointhealliance/bgent)
[![forks - bgent](https://img.shields.io/github/forks/jointhealliance/bgent?style=social)](https://github.com/jointhealliance/bgent)

## Join Us On Discord

[![Join the Discord server](https://dcbadge.vercel.app/api/server/qetWd7J9De)](https://discord.gg/qetWd7J9De)

## Features

- Simple and extensible
- Customizable to your use case
- Retrievable memory and document store
- Serverless artchitecture, deployable in minutes at scale with Cloudflare and Supabase
- Multi-agent and room support
- Summarization and summarization
- Goal-directed behavior

## Try the agent

```
npx bgent
```

## Installation

Currently bgent is dependent on Supabase. You can install it with the following command:

```bash
npm install bgent @supabase/supabase-js
```

### Set up environment variables

You will need a Supbase account, as well as an OpenAI developer account.

Copy and paste the `.dev.vars.example` to `.dev.vars` and fill in the environment variables:

```bash
SUPABASE_URL="https://your-supabase-url.supabase.co"
SUPABASE_SERVICE_API_KEY="your-supabase-service-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

### Supabase Cloud Setup

This library uses Supabase as a database. You can set up a free account at [supabase.io](https://supabase.io) and create a new project.
Step 1: On the Subase All Projects Dashboard, select “New Project”.  
Step 2: Select the organization to store the new project in, assign a database name, password and region.  
Step 3: Select “Create New Project”.  
Step 4: Wait for the database to setup. This will take a few minutes as supabase setups various directories.  
Step 5: Select the “SQL Editor” tab from the left navigation menu.  
Step 6: Copy in your own SQL dump file or optionally use the provided file in the bgent directory at: "src/supabase/db.sql". Note: You can use the command "supabase db dump" if you have a pre-exisiting supabase database to generate the SQL dump file.  
Step 7: Paste the SQL code into the SQL Editor and hit run in the bottom right.  
Step 8: Select the “Databases” tab from the left navigation menu to verify all of the tables have been added properly.

## Development

```
npm run dev # start the server
npm run shell # start the shell in another terminal
```

## Usage

```typescript
import { BgentRuntime } from "bgent";
import { createClient } from "@supabase/supabase-js";
const supabase = new createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_API_KEY,
);

const runtime = new BgentRuntime({
  serverUrl: "https://api.openai.com/v1",
  token: process.env.OPENAI_API_KEY, // Can be an API key or JWT token for your AI services
  supabase,
  actions: [
    /* your custom actions */
  ],
  evaluators: [
    /* your custom evaluators */
  ],
});
```

## Custom Actions

Bgent is customized through actions and evaluators. Actions are functions that are called when a user input is received, and evaluators are functions that are called when a condition is met at the end of a conversation turn.

An example of an action is `wait` (the agent should stop and wait for the user to respond) or `continue` (the agent should continue with the next step in the conversation).

An example of a evaluator is `summarization` (the agent should summarize the conversation so far).

```typescript
import { wait, summarization } from "bgent";

const runtime = new BgentRuntime({
  // ... other options
  actions: [wait],
  evaluators: [summarization],
});

// You can also register actions and evaluators after the runtime has been created
bgentRuntime.registerAction(wait);
bgentRuntime.registerEvaluator(summarization);
```

## Handling User Input

The BgentRuntime instance has a `handleMessage` method that can be used to handle user input. The method returns a promise that resolves to the agent's response.

You will need to make sure that the userIds and room_id already exist in the database. You can use the Supabase client to create new users and rooms if necessary.

```typescript
const message = {
  agentId: "agent-uuid", // Replace with your agent's UUID
  senderId: "user-uuid", // Replace with the sender's UUID
  userIds: ["user-uuid"], // List of user UUIDs involved in the conversation
  content: { content: content }, // The message content
  room_id: "room-uuid", // Replace with the room's UUID
};
const response = await bgentRuntime.handleMessage(message);
console.log("Agent response:", response);
```

## Example Agents

There are two examples which are set up for cloudflare in `src/agents`

- The `simple` example is a simple agent that can be deployed to cloudflare workers
- The `cj` example is a more complex agent that has the ability to introduce users to each other. This agent is also deployable to cloudflare workers, and is the default agent in [Cojourney](https://cojourney.app).

An external example of an agent is the `afbot` Aframe Discord Bot, which is a discord bot that uses bgent as a backend. You can find it [here](https://github.com/JoinTheAlliance/afbot).

### Deploy to Cloudflare

To deploy an agent to Cloudflare, you can run `npm run deploy` -- this will by default deploy the `cj` agent. To deploy your own agent, see the [afbot](https://github.com/JoinTheAlliance/afbot) example.

# Contributions Welcome

If you like this library and want to contribute in any way, please feel free to submit a PR and I will review it. Please note that the goal here is simplicity and accesibility, using common language and few dependencies.
